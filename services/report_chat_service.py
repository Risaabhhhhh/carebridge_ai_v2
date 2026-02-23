# services/report_chat_service.py

from llm.generation import generate
from llm.prompts import report_chat_prompt
from schemas.chat import ReportChatResponse
from services.chat_memory import get_session, add_message, get_history, get_report_data

_MAX_HISTORY_TURNS = 6


def run_report_chat(
    model,
    tokenizer,
    user_question: str,
    session_id: str | None = None,
    report_data: dict | None = None,
) -> ReportChatResponse:
    """
    One-shot  (/report-chat): pass report_data + user_question
    Session   (/chat):        pass session_id + user_question

    Session-based path maintains full conversation history for multi-turn Q&A.
    One-shot path uses only the report data — no memory between calls.
    """

    # ── Resolve report data and history ──────────────────────
    if session_id:
        session = get_session(session_id)
        if not session:
            return ReportChatResponse(
                answer="Session not found or expired. Please start a new chat.",
            )
        report_data = get_report_data(session_id)
        history     = get_history(session_id, max_turns=_MAX_HISTORY_TURNS)
    else:
        if not report_data:
            return ReportChatResponse(answer="No report data provided.")
        history = []

    if not report_data:
        return ReportChatResponse(answer="Report data unavailable for this session.")

    # ── Build prompt with full context ────────────────────────
    prompt = report_chat_prompt(report_data, history, user_question)

    # ── Generate ──────────────────────────────────────────────
    raw = generate(
        prompt,
        model,
        tokenizer,
        max_new_tokens=450,     # 3-5 sentences needs more room than 400
        json_mode=False,
        temperature=0.35,       # slight creativity for natural answers
    )

    answer = raw.strip() if raw and raw.strip() else ""

    # Strip any accidental "Answer:" or "ANSWER:" prefix the model adds
    for prefix in ("Answer:", "ANSWER:", "Assistant:", "ASSISTANT:"):
        if answer.startswith(prefix):
            answer = answer[len(prefix):].strip()
            break

    # Strip any trailing prompt echo (model sometimes repeats the last prompt line)
    cutoff_markers = ["USER QUESTION:", "CONVERSATION HISTORY:", "REPORT TYPE:"]
    for marker in cutoff_markers:
        idx = answer.find(marker)
        if idx > 20:   # only cut if there's actual content before the echo
            answer = answer[:idx].strip()

    # ── Fallback if LLM returned nothing meaningful ───────────
    if len(answer) < 15:
        print(f"⚠ LLM answer too short ({len(answer)} chars) — using deterministic fallback")
        answer = _build_fallback_answer(user_question, report_data)

    # ── Persist to session ────────────────────────────────────
    if session_id:
        add_message(session_id, "user",      user_question)
        add_message(session_id, "assistant", answer)

    sources = _extract_sources(answer, report_data)

    return ReportChatResponse(
        answer=answer,
        session_id=session_id,
        sources=sources,
    )


def _build_fallback_answer(question: str, report: dict) -> str:
    """
    Context-aware fallback that always returns something useful.
    Detects whether this is a prepurchase or audit report from structure.
    """
    q = question.lower()
    is_prepurchase = "clause_risk" in report and "appeal_strength" not in report

    if is_prepurchase:
        score    = report.get("score_breakdown", {}).get("adjusted_score", 0)
        rating   = report.get("overall_policy_rating", "Unknown")
        risk     = report.get("clause_risk", {})
        high     = [k.replace("_"," ") for k, v in risk.items() if v == "High Risk"]
        mod      = [k.replace("_"," ") for k, v in risk.items() if v == "Moderate Risk"]
        comply   = report.get("irdai_compliance", {}).get("compliance_rating", "Unknown")
        broker   = report.get("broker_risk_analysis", {}).get("structural_risk_level", "Unknown")
        checklist = report.get("checklist_for_buyer", [])

        if any(k in q for k in ["risk", "biggest", "danger", "concern", "worst"]):
            if not high:
                return f"No clauses were rated High Risk. Moderate risk areas include: {', '.join(mod[:3]) or 'none detected'}. Overall score: {round(score)}/100 ({rating})."
            return f"The highest-risk clauses are: {', '.join(high[:4])}. These directly reduce your effective coverage. Overall policy score: {round(score)}/100 ({rating}). IRDAI Compliance: {comply}."

        if any(k in q for k in ["waiting", "wait"]):
            wv = risk.get("waiting_period", "Not Found")
            msgs = {
                "High Risk": "This policy has a long waiting period (3+ years). You cannot claim for pre-existing conditions during this period.",
                "Moderate Risk": "The waiting period is Moderate Risk (1–3 years). Confirm the exact duration before signing.",
                "Low Risk": "The waiting period appears short — a positive indicator. Verify the exact clause.",
                "Not Found": "Waiting period was not detectable. Ask the insurer: how many months until pre-existing conditions are covered?",
            }
            return msgs.get(wv, "Could not determine the waiting period risk.")

        if any(k in q for k in ["compliance", "irdai", "regulatory"]):
            return f"IRDAI compliance is rated {comply}. This reflects key consumer protections: free-look period, grievance redressal, and claim timelines. Structural risk: {broker}."

        if any(k in q for k in ["buy", "should i", "recommend", "decision"]):
            if score >= 80: rec = "This policy scores well and appears consumer-friendly."
            elif score >= 55: rec = "Moderate score. Clarify the flagged High Risk clauses before signing."
            else: rec = "Low score. Consider comparing alternatives or negotiating clause amendments."
            return f"Policy Score: {round(score)}/100 ({rating}). Structural Risk: {broker}. {rec}"

        if any(k in q for k in ["negotiate", "before buying", "which clause", "ask"]):
            if not high:
                return "No High Risk clauses detected. Still ask the insurer to clarify exclusions and confirm there are no hidden sub-limits."
            return f"Before buying, get written clarification on: {', '.join(high[:3])}. Also ask for the insurer's claim settlement ratio and exact waiting period duration."

        if any(k in q for k in ["not found", "missing", "detected"]):
            missing = [k.replace("_"," ") for k, v in risk.items() if v == "Not Found"]
            if not missing:
                return "All 10 clauses were detected in the policy text."
            return f"These clauses were not detectable: {', '.join(missing)}. This may mean the text provided was a summary — upload the full policy or ask the insurer directly."

        if checklist:
            return f"Key pre-purchase questions: {' | '.join(checklist[:3])}. Score: {round(score)}/100 ({rating})."

        return f"Policy Score: {round(score)}/100 ({rating}). High Risk clauses: {', '.join(high) or 'none'}. IRDAI Compliance: {comply}. Structural Risk: {broker}."

    # ── Audit fallback ────────────────────────────────────────
    appeal    = report.get("appeal_strength", {})
    pct       = appeal.get("percentage", 0)
    lbl       = appeal.get("label", "Unknown")
    rsn       = appeal.get("reasoning", "")
    why       = report.get("why_rejected", "not specified")
    clause    = report.get("policy_clause_detected", "not identified")
    alignment = report.get("clause_alignment", "Unknown")
    weak      = report.get("weak_points", [])
    strong    = report.get("strong_points", [])
    steps     = report.get("reapplication_steps", [])

    if any(k in q for k in ["strong", "chance", "appeal case", "how strong"]):
        extra = ("Strong position — challenge formally." if pct >= 70 else
                 "Worth pursuing — address the evidence gaps first." if pct >= 40 else
                 "Difficult case — focus on the moratorium rule if policy is 8+ years old.")
        return f"Appeal rated {lbl} at {pct}%. {rsn} {extra}"

    if any(k in q for k in ["overturn", "evidence", "what could", "reverse"]):
        wk = "; ".join(weak[:2]) or "documentation gaps"
        return (f"To overturn: address {wk}. Get a physician's letter confirming exact diagnosis date, "
                f"gather records showing when the condition first manifested, and cross-reference the rejection "
                f"clause against IRDAI's standardised exclusion definitions. "
                f"If the policy is 8+ years old, invoke the IRDAI moratorium — pre-existing exclusions cannot apply.")

    if any(k in q for k in ["moratorium", "8 year", "8-year"]):
        return ("The IRDAI 8-year moratorium: after 8 continuous years on any health policy, "
                "the insurer cannot reject citing pre-existing disease — even if not disclosed at inception. "
                "If your policy (or ported predecessor) is 8+ years old, this is your strongest legal argument.")

    if any(k in q for k in ["next step", "what should", "what do i", "how do i"]):
        if steps:
            s = " ".join(f"{i+1}. {t}" for i, t in enumerate(steps[:3]))
            return f"{s} File with IRDAI IGMS if no response in 15 days. Approach Ombudsman within 1 year."
        return ("1. File written complaint with insurer GRO. "
                "2. Escalate to IRDAI IGMS (igms.irda.gov.in) if no response in 15 days. "
                "3. Approach Insurance Ombudsman (cioins.co.in) within 1 year of final reply.")

    if any(k in q for k in ["ombudsman", "escalat", "complain", "igms"]):
        return ("File with IRDAI IGMS first. If unresolved in 30 days, approach the Insurance Ombudsman. "
                "Eligibility: claims up to ₹50 lakhs, within 1 year of the insurer's final reply. Free and binding.")

    if any(k in q for k in ["document", "need", "bring", "submit"]):
        return ("For appeal: (1) full policy document, (2) original rejection letter, "
                "(3) all medical records submitted with claim, (4) hospital discharge summary and bills, "
                "(5) doctor's certificate with exact diagnosis date, (6) prior insurer correspondence.")

    if any(k in q for k in ["clause", "exclusion", "why", "what clause"]):
        challengeable = alignment in ("Weak", "Not Detected")
        return (f'Clause applied: "{clause}". Rejection basis: "{why}". '
                f"Alignment: {alignment}. "
                f"{'This is potentially challengeable — the insurer application appears weak.' if challengeable else 'The insurer has a policy basis, but you can still contest the interpretation.'}")

    st = "; ".join(strong[:2]) or "none identified"
    wk = "; ".join(weak[:2]) or "none identified"
    return (f'Rejection: "{why}". Clause: "{clause}" ({alignment} alignment). '
            f"Appeal: {lbl} ({pct}%). Strong: {st}. Challenges: {wk}.")


def _extract_sources(text: str, report_data: dict) -> list[str]:
    """Extract IRDAI regulatory references from the answer text."""
    refs = []
    text_lower = text.lower()

    checks = [
        ("moratorium",       "IRDAI 8-Year Moratorium Rule"),
        ("irdai",            "IRDAI Policyholders' Protection Regulations 2017"),
        ("ombudsman",        "Insurance Ombudsman Rules 2017"),
        ("free look",        "IRDAI Free Look Period Mandate"),
        ("waiting period",   "IRDAI Waiting Period Regulations"),
        ("pre-existing",     "IRDAI Pre-existing Disease Definition"),
        ("consumer protect", "Consumer Protection Act 2019"),
        ("igms",             "IRDAI IGMS Grievance Portal"),
        ("copay",            "IRDAI Co-payment Regulation"),
        ("restoration",      "IRDAI Sum Insured Restoration Guidelines"),
    ]

    for keyword, label in checks:
        if keyword in text_lower and label not in refs:
            refs.append(label)
        if len(refs) >= 3:
            break

    return refs