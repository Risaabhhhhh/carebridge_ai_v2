# services/report_chat_service.py
#
# Multilingual-aware report chat service.
# lang param ("en", "hi", "mr", "ta") threads through prompt + fallback.

from llm.generation import generate
from llm.multilingual_translations import t, SPEECH_LANG_CODES
from schemas.chat import ReportChatResponse
from services.chat_memory import get_session, add_message, get_history, get_report_data
from llm.report_chat_prompt import report_chat_prompt   

_MAX_HISTORY_TURNS = 6
_SUPPORTED_LANGS   = set(SPEECH_LANG_CODES.keys())

# ══════════════════════════════════════════════════════════════════════════════
# INTENT KEYWORD SETS — covers English + Hindi + Marathi + Tamil
# q.lower() is matched against these. Add synonyms freely.
# ══════════════════════════════════════════════════════════════════════════════

# ── Pre-purchase intents ──────────────────────────────────────────────────────

_INTENT_RISK = {
    # English
    "risk", "biggest", "danger", "concern", "worst", "high risk",
    "bad clause", "problem", "issue",
    # Hindi
    "jokhim", "khatre", "khatarnak", "bura", "nuksaan", "nuksan",
    "dikkat", "pareshani", "sabse bura", "kyun bura", "kyon bura",
    "kharab", "buri", "galat",
    # Marathi
    "dhoka", "dhokyacha", "vaait", "aapatti", "samashya", "prashn",
    # Tamil
    "aapathu", "aabathu", "kettadhu", "mosam", "ketta", "aapam",
}

_INTENT_WAITING = {
    # English
    "wait", "waiting", "waiting period", "how long", "when covered",
    "when does", "when will",
    # Hindi
    "prateeksha", "intezaar", "kab se", "kitne saal", "kitne din",
    "kab cover", "kab milega", "wait karna", "wait period",
    "pratiksha avdhi",
    # Marathi
    "thamba", "kiti divas", "kiti varsha", "kelach cover",
    "pratiksha kalavdhi",
    # Tamil
    "kaththiru", "eppodhu", "entha naal", "ezha",
}

_INTENT_COMPLIANCE = {
    # English
    "compliance", "irdai", "regulatory", "regulation", "rules", "standard",
    # Hindi
    "niyam", "niyamak", "sarkar", "kanoon", "adhikar", "irdai niyam",
    "irdai ka", "sarkari",
    # Marathi
    "niyam", "niyamak", "kanoon", "irdai niyam",
    # Tamil
    "vidhimurai", "murayeedu", "sarkar", "irdai vidhigal", "irdai",
}

_INTENT_BUY = {
    # English
    "buy", "should i", "purchase", "recommend", "worth", "take this",
    "is it good", "good policy", "is this good",
    # Hindi
    "kharidun", "kharidu", "khareedun", "lena chahiye", "lena chahie",
    "achchi hai", "acchi hai", "theek hai", "le lun", "kya lu",
    "kya lena", "kharidna", "kya sahi hai", "lena chahiye kya",
    "kharidni chahiye", "sahi hai kya", "kharidna chahiye",
    # Marathi
    "kharedi", "ghyave ka", "ghyava ka", "changle ahe", "vikat ghyave",
    "ghene", "ghenare ka",
    # Tamil
    "vanganuma", "vaangalama", "nalladha", "edukkalama", "vanga",
}

_INTENT_NEGOTIATE = {
    # English
    "negotiate", "before buying", "which clause", "ask", "clarify", "check",
    "question insurer", "what to ask",
    # Hindi
    "pucho", "puchna", "kya puchun", "kaun sa", "seedha puchho",
    "pahle", "kya check karu", "negotiate karo", "puchtaach",
    # Marathi
    "vicharaa", "kaay vicharave", "aadhi", "check kara", "vicharne",
    # Tamil
    "kelunga", "kaanal", "yaendru kelunga", "ketka",
}

_INTENT_NOT_FOUND = {
    # English
    "not found", "missing", "not detected", "not shown", "cant find",
    # Hindi
    "nahi mila", "nahi dikh raha", "nahi hai", "detect nahi",
    "nahi dikh", "kahan hai",
    # Marathi
    "sapadla nahi", "disle nahi", "nahi sapadla",
    # Tamil
    "kandupidikkavillai", "illai", "theriyavillai",
}

# ── Audit intents ─────────────────────────────────────────────────────────────

_INTENT_APPEAL = {
    # English
    "strong", "chance", "appeal", "how strong", "direction", "winning",
    "appeal strength", "appeal direction",
    # Hindi
    "kitni", "appeal karo", "mazbut", "mazboot", "jeetne ki",
    "appeal kitni", "appeal strong", "appeal weak", "appeal direction",
    "appeal ki taakat", "appeal ka",
    # Marathi
    "appeal", "kitpat", "mazboot", "appeal direction", "appeal chi",
    # Tamil
    "appeal", "valimaiyana", "vaaippu", "appeal strength",
}

_INTENT_OVERTURN = {
    # English
    "overturn", "evidence", "reverse", "strengthen", "what could help",
    "how to win", "what proof",
    # Hindi
    "palat", "badal", "kaise jeeten", "kya kare", "saboot",
    "evidence kya", "kya laun", "strengthen karo", "ulta karo",
    # Marathi
    "ulat", "badal", "kase jeenkave", "puraava", "saboot",
    # Tamil
    "marru", "thirumbu", "saatchi", "evidence", "thirumpa",
}

_INTENT_MORATORIUM = {
    # English
    "moratorium", "8 year", "8-year", "eight year", "8 years",
    # Hindi
    "moratorium", "8 saal", "aath saal", "8 varsh", "aath varsh",
    # Marathi
    "moratorium", "8 varsha", "aath varsha",
    # Tamil
    "moratorium", "8 varudham", "ettaandu",
}

_INTENT_NEXT_STEPS = {
    # English
    "next step", "what should", "what do i", "how do i", "what now",
    "what next", "steps",
    # Hindi
    "kya karu", "aage kya", "next step", "kya karna", "ab kya",
    "kya karna chahiye", "agle kadam", "kya karun",
    # Marathi
    "pudhe kay", "aata kay", "kaye karave", "pudha kadam",
    # Tamil
    "enna seiya", "epdi seiya", "munnetrm", "enna pannanum",
}

_INTENT_OMBUDSMAN = {
    # English
    "ombudsman", "escalat", "igms", "complain", "grievance", "gro",
    # Hindi
    "shikayat", "takraar", "ombudsman", "igms", "escalate karo",
    "fariyaad", "complaint",
    # Marathi
    "takraar", "ombudsman", "igms", "tक्रार",
    # Tamil
    "manauvinaippu", "ombudsman", "igms", "pulaampudhal",
}

_INTENT_DOCUMENTS = {
    # English
    "document", "need", "bring", "submit", "what papers", "paperwork",
    # Hindi
    "dastavez", "kagaz", "kya laana", "kya chahiye", "submit karna",
    "kaagaz", "documents chahiye",
    # Marathi
    "kagadpatra", "kaye lavave", "submit kara", "kagad",
    # Tamil
    "aavaNam", "enna kotukkanam", "papers", "documents",
}

_INTENT_CLAUSE = {
    # English
    "clause", "exclusion", "why", "reason", "what clause", "rejected because",
    # Hindi
    "kyun", "kyon", "kaaran", "clause", "kya likha", "kya hai",
    "atka raha", "rok raha", "kyun atka", "kyon roka", "kyu",
    "kyu atka", "kyon atka",
    # Marathi
    "ka", "kaarana", "clause", "kaya lihalay", "kaa nakarale",
    # Tamil
    "yen", "karanam", "clause", "enna vithi", "yean",
}


def _matches(q: str, intent_set: set) -> bool:
    """True if any keyword from intent_set is a substring of q."""
    return any(kw in q for kw in intent_set)


# ══════════════════════════════════════════════════════════════════════════════
# MAIN SERVICE FUNCTION
# ══════════════════════════════════════════════════════════════════════════════

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

    # ── Fallback if LLM returned nothing meaningful ───────────────────────────
    # Threshold lowered to 8 — short valid answers in Hindi/Tamil can be <15 chars
    if len(answer) < 8:
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
    q = question.lower()
    is_prepurchase = "clause_risk" in report and "appeal_strength" not in report
    return _prepurchase_fallback(q, report, lang) if is_prepurchase else _audit_fallback(q, report, lang)


def _prepurchase_fallback(q: str, report: dict, lang: str) -> str:
    score     = round(float(report.get("score_breakdown", {}).get("adjusted_score", 0)))
    rating    = report.get("overall_policy_rating", "Unknown")
    risk      = report.get("clause_risk", {})
    high      = [k.replace("_", " ") for k, v in risk.items() if v == "High Risk"]
    mod       = [k.replace("_", " ") for k, v in risk.items() if v == "Moderate Risk"]
    comply    = report.get("irdai_compliance", {}).get("compliance_rating", "Unknown")
    broker    = report.get("broker_risk_analysis", {}).get("structural_risk_level", "Unknown")
    checklist = report.get("checklist_for_buyer", [])

    if _matches(q, _INTENT_RISK):
        if not high:
            return t("no_high_risk", lang, mod=", ".join(mod[:3]) or "none",
                     score=score, rating=rating)
        return t("risk", lang, high=", ".join(high[:4]), score=score,
                 rating=rating, comply=comply)

    if _matches(q, _INTENT_WAITING):
        wv = risk.get("waiting_period", "Not Found")
        key_map = {
            "High Risk":     "waiting_high",
            "Moderate Risk": "waiting_moderate",
            "Low Risk":      "waiting_low",
            "Not Found":     "waiting_not_found",
        }
        return t(key_map.get(wv, "waiting_not_found"), lang)

    if _matches(q, _INTENT_COMPLIANCE):
        return t("compliance", lang, comply=comply, broker=broker)

    if _matches(q, _INTENT_BUY):
        key = "buy_strong" if score >= 72 else "buy_moderate" if score >= 48 else "buy_weak"
        return t(key, lang, score=score, rating=rating, broker=broker)

    if _matches(q, _INTENT_NEGOTIATE):
        if not high:
            return t("negotiate_none", lang)
        return t("negotiate_high", lang, high=", ".join(high[:3]))

    if _matches(q, _INTENT_NOT_FOUND):
        missing = [k.replace("_", " ") for k, v in risk.items() if v == "Not Found"]
        if not missing:
            return t("all_found", lang)
        return t("not_found_missing", lang, missing=", ".join(missing))

    # Generic — includes full context even as fallback
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

    if _matches(q, _INTENT_APPEAL):
        key = "appeal_strong" if pct >= 70 else "appeal_moderate" if pct >= 40 else "appeal_weak"
        return t(key, lang, label=label, pct=pct, reasoning=reasoning)

    if _matches(q, _INTENT_OVERTURN):
        wk = "; ".join(weak[:2]) or "documentation gaps"
        return t("overturn", lang, weak=wk)

    if _matches(q, _INTENT_MORATORIUM):
        return t("moratorium", lang)

    if _matches(q, _INTENT_NEXT_STEPS):
        if steps:
            steps_str = " ".join(f"{i+1}. {s}" for i, s in enumerate(steps[:3]))
            return t("next_steps_dynamic", lang, steps=steps_str)
        return t("next_steps_generic", lang)

    if _matches(q, _INTENT_OMBUDSMAN):
        return t("ombudsman", lang)

    if _matches(q, _INTENT_DOCUMENTS):
        return t("documents", lang)

    if _matches(q, _INTENT_CLAUSE):
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
    refs  = []
    lower = text.lower()
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