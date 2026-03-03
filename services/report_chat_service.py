# services/report_chat_service.py
#
# Multilingual-aware report chat service.
# lang param ("en", "hi", "mr", "ta") threads through prompt + fallback.

from llm.generation import generate
from llm.report_chat_prompt import report_chat_prompt
from llm.multilingual_translations import t, SPEECH_LANG_CODES
from schemas.chat import ReportChatResponse
from services.chat_memory import get_session, add_message, get_history, get_report_data

_MAX_HISTORY_TURNS = 6
_SUPPORTED_LANGS   = set(SPEECH_LANG_CODES.keys())


def run_report_chat(
    model,
    tokenizer,
    user_question: str,
    session_id: str | None = None,
    report_data: dict | None = None,
    lang: str = "en",
) -> ReportChatResponse:
    """
    One-shot  (/report-chat): pass report_data + user_question + lang
    Session   (/chat):        pass session_id + user_question + lang

    lang: "en" | "hi" | "mr" | "ta"  (falls back to "en" if unsupported)
    """

    lang = lang if lang in _SUPPORTED_LANGS else "en"

    # ── Resolve report data and history ──────────────────────────────────────
    if session_id:
        session = get_session(session_id)
        if not session:
            return ReportChatResponse(
                answer=_session_not_found_msg(lang),
            )
        report_data = get_report_data(session_id)
        history     = get_history(session_id, max_turns=_MAX_HISTORY_TURNS)
    else:
        if not report_data:
            return ReportChatResponse(answer=_no_report_msg(lang))
        history = []

    if not report_data:
        return ReportChatResponse(answer=_no_report_msg(lang))

    # ── Build multilingual prompt ─────────────────────────────────────────────
    prompt = report_chat_prompt(report_data, history, user_question, lang=lang)

    # ── Generate ──────────────────────────────────────────────────────────────
    raw = generate(
        prompt,
        model,
        tokenizer,
        max_new_tokens=450,
        json_mode=False,
        temperature=0.35,
    )

    answer = raw.strip() if raw and raw.strip() else ""

    # Strip model prefix artifacts
    for prefix in ("Answer:", "ANSWER:", "Assistant:", "ASSISTANT:", "ANSWER:\n"):
        if answer.startswith(prefix):
            answer = answer[len(prefix):].strip()
            break

    # Strip any prompt echo
    for marker in ("USER QUESTION:", "CONVERSATION HISTORY:", "REPORT TYPE:", "REPORT DATA:"):
        idx = answer.find(marker)
        if idx > 20:
            answer = answer[:idx].strip()

    # ── Fallback if LLM returned nothing ─────────────────────────────────────
    if len(answer) < 15:
        print(f"⚠ LLM answer too short ({len(answer)}) — deterministic fallback")
        answer = _build_fallback_answer(user_question, report_data, lang)

    # ── Persist to session ────────────────────────────────────────────────────
    if session_id:
        add_message(session_id, "user",      user_question)
        add_message(session_id, "assistant", answer)

    sources = _extract_sources(answer, report_data)

    return ReportChatResponse(
        answer=answer,
        session_id=session_id,
        sources=sources,
    )


# ══════════════════════════════════════════════════════════════════════════════
# MULTILINGUAL FALLBACK ANSWERS
# ══════════════════════════════════════════════════════════════════════════════

def _build_fallback_answer(question: str, report: dict, lang: str = "en") -> str:
    """
    Context-aware multilingual fallback.
    Detects report type from structure, then matches intent from question keywords.
    All strings come from multilingual_translations.t().
    """
    q = question.lower()
    is_prepurchase = "clause_risk" in report and "appeal_strength" not in report

    if is_prepurchase:
        return _prepurchase_fallback(q, report, lang)
    else:
        return _audit_fallback(q, report, lang)


def _prepurchase_fallback(q: str, report: dict, lang: str) -> str:
    score   = round(float(report.get("score_breakdown", {}).get("adjusted_score", 0)))
    rating  = report.get("overall_policy_rating", "Unknown")
    risk    = report.get("clause_risk", {})
    high    = [k.replace("_", " ") for k, v in risk.items() if v == "High Risk"]
    mod     = [k.replace("_", " ") for k, v in risk.items() if v == "Moderate Risk"]
    comply  = report.get("irdai_compliance", {}).get("compliance_rating", "Unknown")
    broker  = report.get("broker_risk_analysis", {}).get("structural_risk_level", "Unknown")
    checklist = report.get("checklist_for_buyer", [])

    if any(k in q for k in ["risk", "biggest", "danger", "concern", "worst",
                              "jokhim", "khatre", "aapad", "aapatti"]):
        if not high:
            return t("no_high_risk", lang, mod=", ".join(mod[:3]) or "none", score=score, rating=rating)
        return t("risk", lang, high=", ".join(high[:4]), score=score, rating=rating, comply=comply)

    if any(k in q for k in ["wait", "waiting", "prateeksha", "prateekshe", "kaththiruppu"]):
        wv = risk.get("waiting_period", "Not Found")
        key_map = {
            "High Risk":     "waiting_high",
            "Moderate Risk": "waiting_moderate",
            "Low Risk":      "waiting_low",
            "Not Found":     "waiting_not_found",
        }
        return t(key_map.get(wv, "waiting_not_found"), lang)

    if any(k in q for k in ["compliance", "irdai", "regulatory", "niyamak"]):
        return t("compliance", lang, comply=comply, broker=broker)

    if any(k in q for k in ["buy", "should i", "recommend", "kharidun", "kharedi",
                              "purchase", "lo", "lena"]):
        key = "buy_strong" if score >= 72 else "buy_moderate" if score >= 48 else "buy_weak"
        return t(key, lang, score=score, rating=rating, broker=broker)

    if any(k in q for k in ["negotiate", "before buying", "which clause", "ask",
                              "pucho", "vicharaa", "kaanal"]):
        if not high:
            return t("negotiate_none", lang)
        return t("negotiate_high", lang, high=", ".join(high[:3]))

    if any(k in q for k in ["not found", "missing", "detected", "nahi mila",
                              "aadhalit nahi", "kandu aale nahi"]):
        missing = [k.replace("_", " ") for k, v in risk.items() if v == "Not Found"]
        if not missing:
            return t("all_found", lang)
        return t("not_found_missing", lang, missing=", ".join(missing))

    if checklist:
        checklist_preview = " | ".join(checklist[:3])
        return t("generic", lang, score=score, rating=rating,
                 high=", ".join(high) or "none", comply=comply, broker=broker)

    return t("generic", lang, score=score, rating=rating,
             high=", ".join(high) or "none", comply=comply, broker=broker)


def _audit_fallback(q: str, report: dict, lang: str) -> str:
    appeal    = report.get("appeal_strength", {})
    pct       = appeal.get("percentage", 0)
    label     = appeal.get("label", "Unknown")
    reasoning = appeal.get("reasoning", "")
    why       = report.get("why_rejected", "not specified")
    clause    = report.get("policy_clause_detected", "not identified")
    alignment = report.get("clause_alignment", "Unknown")
    weak      = report.get("weak_points", [])
    strong    = report.get("strong_points", [])
    steps     = report.get("reapplication_steps", [])

    if any(k in q for k in ["strong", "chance", "appeal", "how strong",
                              "kitni", "appeal karo", "mazbut", "mazboot"]):
        key = "appeal_strong" if pct >= 70 else "appeal_moderate" if pct >= 40 else "appeal_weak"
        return t(key, lang, label=label, pct=pct, reasoning=reasoning)

    if any(k in q for k in ["overturn", "evidence", "reverse", "palat",
                              "badal", "cancel"]):
        wk = "; ".join(weak[:2]) or "documentation gaps"
        return t("overturn", lang, weak=wk)

    if any(k in q for k in ["moratorium", "8 year", "8-year", "8 saal",
                              "moratorium niyam"]):
        return t("moratorium", lang)

    if any(k in q for k in ["next step", "what should", "kya karu", "pudhe",
                              "aata", "enna seiya"]):
        if steps:
            steps_str = " ".join(f"{i+1}. {s}" for i, s in enumerate(steps[:3]))
            return t("next_steps_dynamic", lang, steps=steps_str)
        return t("next_steps_generic", lang)

    if any(k in q for k in ["ombudsman", "escalat", "complain", "igms",
                              "shikayat", "takraar"]):
        return t("ombudsman", lang)

    if any(k in q for k in ["document", "need", "bring", "submit", "dastavez",
                              "kagaz", "aavashyak"]):
        return t("documents", lang)

    if any(k in q for k in ["clause", "exclusion", "why", "kyon", "kyun",
                              "kaaran", "kaarana"]):
        challengeable = alignment in ("Weak", "Not Detected")
        key = "clause_challengeable" if challengeable else "clause_firm"
        return t(key, lang, clause=clause, why=why, alignment=alignment)

    st = "; ".join(strong[:2]) or "none identified"
    wk = "; ".join(weak[:2]) or "none identified"
    return t("generic", lang, why=why, clause=clause, alignment=alignment,
             label=label, pct=pct, strong=st, weak=wk)


# ── System messages ───────────────────────────────────────────────────────────

def _session_not_found_msg(lang: str) -> str:
    msgs = {
        "en": "Session not found or expired. Please start a new chat.",
        "hi": "सत्र नहीं मिला या समाप्त हो गया। कृपया नई चैट शुरू करें।",
        "mr": "सत्र सापडले नाही किंवा कालबाह्य झाले. कृपया नवीन चॅट सुरू करा.",
        "ta": "அமர்வு கண்டறியப்படவில்லை அல்லது காலாவதியானது. புதிய அரட்டையை தொடங்கவும்.",
    }
    return msgs.get(lang, msgs["en"])


def _no_report_msg(lang: str) -> str:
    msgs = {
        "en": "No report data provided.",
        "hi": "कोई रिपोर्ट डेटा प्रदान नहीं किया गया।",
        "mr": "कोणताही अहवाल डेटा प्रदान केला नाही.",
        "ta": "எந்த அறிக்கை தரவும் வழங்கப்படவில்லை.",
    }
    return msgs.get(lang, msgs["en"])


def _extract_sources(text: str, report_data: dict) -> list[str]:
    """Extract IRDAI regulatory references mentioned in the answer."""
    refs   = []
    lower  = text.lower()
    checks = [
        ("moratorium",     "IRDAI 8-Year Moratorium Rule"),
        ("irdai",          "IRDAI Policyholders' Protection Regulations 2017"),
        ("ombudsman",      "Insurance Ombudsman Rules 2017"),
        ("free look",      "IRDAI Free Look Period Mandate"),
        ("waiting period", "IRDAI Waiting Period Regulations"),
        ("pre-existing",   "IRDAI Pre-existing Disease Definition"),
        ("igms",           "IRDAI IGMS Grievance Portal"),
        ("co-pay",         "IRDAI Co-payment Regulation"),
        ("restoration",    "IRDAI Sum Insured Restoration Guidelines"),
        ("consumer",       "Consumer Protection Act 2019"),
    ]
    for keyword, label in checks:
        if keyword in lower and label not in refs:
            refs.append(label)
        if len(refs) >= 3:
            break
    return refs