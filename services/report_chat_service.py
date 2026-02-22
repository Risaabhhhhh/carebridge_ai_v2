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
    """

    # Resolve report data and history
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

    # Build prompt
    prompt = report_chat_prompt(report_data, history, user_question)

    # Generate — use higher token limit and temperature for conversational answers
    raw = generate(
        prompt,
        model,
        tokenizer,
        max_new_tokens=400,   # was 200 — too small for a useful answer
        json_mode=False,
        temperature=0.3,      # slight creativity for natural language
    )

    answer = raw.strip() if raw and raw.strip() else ""

    # If still empty, build a context-aware fallback from report data
    if not answer:
        answer = _build_fallback_answer(user_question, report_data or {})

    # Persist to session if session-based
    if session_id:
        add_message(session_id, "user",      user_question)
        add_message(session_id, "assistant", answer)

    sources = _extract_sources(answer)

    return ReportChatResponse(
        answer=answer,
        session_id=session_id,
        sources=sources,
    )


def _build_fallback_answer(question: str, report: dict) -> str:
    """
    Construct a useful answer directly from report fields when LLM generation fails.
    This ensures the user NEVER sees the generic error message.
    """
    q   = question.lower()
    pct = report.get("appeal_strength", {}).get("percentage", 0)
    lbl = report.get("appeal_strength", {}).get("label", "Unknown")
    rsn = report.get("appeal_strength", {}).get("reasoning", "")
    why = report.get("why_rejected", "not specified")
    cla = report.get("policy_clause_detected", "not identified")
    aln = report.get("clause_alignment", "Unknown")
    wk  = report.get("weak_points", [])
    st  = report.get("strong_points", [])
    steps = report.get("reapplication_steps", [])

    if any(k in q for k in ["strong", "appeal case", "how strong", "chance"]):
        extra = (
            "This is a favourable position — you have solid grounds to challenge the rejection."
            if pct >= 70 else
            "There are real grounds to appeal, but documentation gaps need addressing first."
            if pct >= 40 else
            "The insurer's position appears well-grounded. Focus on gathering stronger evidence."
        )
        return f"Your appeal is rated {lbl} at {pct}%. {rsn} {extra}"

    if any(k in q for k in ["overturn", "evidence", "what could", "what would"]):
        weak_str = "; ".join(wk[:2]) if wk else "documentation gaps"
        return (
            f"To overturn this decision, directly address: {weak_str}. "
            f"Obtain a physician's letter confirming the exact diagnosis date, "
            f"gather medical records showing when the condition first manifested, "
            f"and cross-reference the policy clause wording against IRDAI's standardised exclusion definitions. "
            f"If the policy is 3+ years old, you may also invoke the moratorium clause."
        )

    if any(k in q for k in ["weak", "why is", "why appeal", "why weak"]):
        wk_str = "; ".join(wk) if wk else rsn
        return (
            f"The appeal is rated {lbl} because: {wk_str}. "
            f"The clause detected was \"{cla}\" and the insurer's position is {aln.lower()} "
            f"aligned with the policy wording."
        )

    if any(k in q for k in ["next step", "what should", "what do i do", "how do i"]):
        if steps:
            steps_str = " ".join(f"{i+1}. {s}" for i, s in enumerate(steps[:3]))
            return (
                f"Your immediate next steps: {steps_str} "
                f"If unresolved in 15 days, escalate to IRDAI IGMS at igms.irda.gov.in. "
                f"The Ombudsman is available for claims up to Rs 50 lakhs."
            )
        return (
            "1. File a written complaint with the insurer's Grievance Redressal Officer (GRO). "
            "2. If unresolved in 15 days, escalate to IRDAI IGMS at igms.irda.gov.in. "
            "3. File before the Insurance Ombudsman within 1 year of the insurer's final reply."
        )

    if any(k in q for k in ["ombudsman", "escalat", "complain"]):
        return (
            "You can approach the Insurance Ombudsman if the insurer hasn't responded in 15 days "
            "or you are unsatisfied with their reply. File within 1 year of the insurer's decision. "
            "The Ombudsman handles claims up to Rs 50 lakhs free of charge. "
            "Find your nearest office at cioins.co.in."
        )

    if any(k in q for k in ["document", "what do i need", "what to bring"]):
        return (
            "For your appeal gather: (1) Policy document with complete schedule, "
            "(2) Original rejection letter, (3) All medical records submitted with the claim, "
            "(4) Hospital discharge summary and bills, "
            "(5) Doctor's notes confirming diagnosis date, "
            "(6) Any prior correspondence with the insurer."
        )

    if any(k in q for k in ["clause", "policy", "exclusion", "what clause"]):
        return (
            f"The clause invoked is: \"{cla}\". "
            f"The rejection basis is: \"{why}\". "
            f"The alignment between the rejection grounds and this clause is {aln.lower()}. "
            f"Check the exact policy schedule to verify this clause was correctly applied."
        )

    # Generic fallback with actual report data
    st_str = "; ".join(st[:2]) if st else "none identified"
    wk_str = "; ".join(wk[:2]) if wk else "none identified"
    return (
        f"Based on your audit: rejection was due to \"{why}\". "
        f"Clause detected: \"{cla}\" ({aln.lower()} alignment). "
        f"Appeal strength: {lbl} ({pct}%). "
        f"Strong points: {st_str}. "
        f"Challenges: {wk_str}. "
        f"{rsn}"
    )


def _extract_sources(text: str) -> list[str]:
    """Pull out any IRDAI/Ombudsman references mentioned in the answer."""
    refs = []
    checks = [
        ("IRDAI",          "IRDAI Protection of Policyholders' Interests Regulations 2017"),
        ("Ombudsman",      "Insurance Ombudsman Rules 2017"),
        ("moratorium",     "IRDAI 8-Year Moratorium Rule"),
        ("free look",      "IRDAI Free Look Period Mandate"),
        ("waiting period", "IRDAI Waiting Period Regulations"),
        ("pre-existing",   "IRDAI Pre-existing Disease Definition"),
    ]
    lower = text.lower()
    for keyword, label in checks:
        if keyword.lower() in lower and label not in refs:
            refs.append(label)
    return refs[:3]