# services/report_chat_service.py
#
# Multilingual-aware report chat service.
# Covers: audit · prepurchase · escalation · legal aid · financial support · learn
# lang param ("en", "hi", "mr", "ta") threads through prompt + fallback.

# ── IMPORT ORDER MATTERS ───────────────────────────────────────────────────────
# multilingual_translations has NO imports from llm/ (it's a pure constants file)
# report_chat_prompt imports FROM multilingual_translations (one-way only)
# This file imports both — translations first, then prompt. Never reverse this.
# ──────────────────────────────────────────────────────────────────────────────
from llm.generation import generate
from llm.multilingual_translations import t, SPEECH_LANG_CODES   # ← FIRST
from llm.report_chat_prompt import report_chat_prompt             # ← SECOND
from schemas.chat import ReportChatResponse
from services.chat_memory import get_session, add_message, get_history, get_report_data

_MAX_HISTORY_TURNS = 6
_SUPPORTED_LANGS   = set(SPEECH_LANG_CODES.keys())


# ══════════════════════════════════════════════════════════════════════════════
# INTENT KEYWORD SETS
# ══════════════════════════════════════════════════════════════════════════════

_INTENT_RISK = {
    "risk", "biggest", "danger", "concern", "worst", "high risk",
    "bad clause", "problem", "issue",
    "jokhim", "khatre", "khatarnak", "bura", "nuksaan", "nuksan",
    "dikkat", "pareshani", "sabse bura", "kyun bura", "kyon bura",
    "kharab", "buri", "galat",
    "dhoka", "dhokyacha", "vaait", "aapatti", "samashya", "prashn",
    "aapathu", "aabathu", "kettadhu", "mosam", "ketta", "aapam",
}

_INTENT_WAITING = {
    "wait", "waiting", "waiting period", "how long", "when covered",
    "when does", "when will",
    "prateeksha", "intezaar", "kab se", "kitne saal", "kitne din",
    "kab cover", "kab milega", "wait karna", "wait period",
    "thamba", "kiti divas", "kiti varsha",
    "kaththiru", "eppodhu", "entha naal", "ezha",
}

_INTENT_COMPLIANCE = {
    "compliance", "irdai", "regulatory", "regulation", "rules", "standard",
    "niyam", "niyamak", "sarkar", "kanoon", "adhikar",
    "vidhimurai", "murayeedu", "irdai vidhigal",
}

_INTENT_BUY = {
    "buy", "should i", "purchase", "recommend", "worth", "take this",
    "is it good", "good policy", "is this good",
    "kharidun", "kharidu", "khareedun", "lena chahiye", "lena chahie",
    "achchi hai", "acchi hai", "theek hai", "le lun", "kya lu",
    "kya lena", "kharidna", "kya sahi hai", "lena chahiye kya",
    "kharidni chahiye", "sahi hai kya", "kharidna chahiye",
    "kharedi", "ghyave ka", "ghyava ka", "changle ahe",
    "vanganuma", "vaangalama", "nalladha", "edukkalama",
}

_INTENT_NEGOTIATE = {
    "negotiate", "before buying", "which clause", "ask", "clarify", "check",
    "question insurer", "what to ask",
    "pucho", "puchna", "kya puchun", "kaun sa", "seedha puchho",
    "pahle", "kya check karu",
    "vicharaa", "kaay vicharave", "aadhi",
    "kelunga", "kaanal", "yaendru kelunga",
}

_INTENT_NOT_FOUND = {
    "not found", "missing", "not detected", "not shown",
    "nahi mila", "nahi dikh raha", "nahi hai",
    "sapadla nahi", "disle nahi",
    "kandupidikkavillai", "illai", "theriyavillai",
}

_INTENT_APPEAL = {
    "strong", "chance", "appeal", "how strong", "direction", "winning",
    "kitni", "mazbut", "mazboot", "jeetne ki",
    "appeal kitni", "appeal strong", "appeal weak", "appeal direction",
    "valimaiyana", "vaaippu",
}

_INTENT_OVERTURN = {
    "overturn", "evidence", "reverse", "strengthen", "what could help",
    "how to win", "what proof",
    "palat", "badal", "kaise jeeten", "saboot", "evidence kya", "kya laun",
    "ulat", "puraava",
    "marru", "thirumbu", "saatchi",
}

_INTENT_MORATORIUM = {
    "moratorium", "8 year", "8-year", "eight year", "8 years",
    "8 saal", "aath saal", "8 varsh",
    "8 varsha", "aath varsha",
    "8 varudham", "ettaandu",
}

_INTENT_NEXT_STEPS = {
    "next step", "what should", "what do i", "how do i", "what now",
    "what next", "steps",
    "kya karu", "aage kya", "kya karna", "ab kya", "kya karna chahiye",
    "pudhe kay", "aata kay", "kaye karave",
    "enna seiya", "epdi seiya", "enna pannanum",
}

_INTENT_OMBUDSMAN = {
    "ombudsman", "escalat", "igms", "complain", "grievance", "gro",
    "shikayat", "takraar", "fariyaad", "complaint",
    "menaley", "pulaampudhal",
}

_INTENT_DOCUMENTS = {
    "document", "need", "bring", "submit", "what papers", "paperwork",
    "dastavez", "kagaz", "kya laana", "kya chahiye",
    "kagadpatra", "kaye lavave",
    "aavaNam", "enna kotukkanam", "papers",
}

_INTENT_CLAUSE = {
    "clause", "exclusion", "why", "reason", "what clause", "rejected because",
    "kyun", "kyon", "kaaran", "kya likha", "kya hai",
    "atka raha", "rok raha", "kyun atka", "kyon roka", "kyu",
    "ka", "kaarana", "kaya lihalay",
    "yen", "karanam", "enna vithi", "yean",
}

_INTENT_ESCALATION = {
    "escalate", "gro", "complain", "complaint", "grievance", "portal",
    "igms", "next level", "not resolved", "what after", "after ombudsman",
    "consumer court", "legal action", "escalation",
    "shikayat kahan", "aage kya karen", "gro ko", "portal pe", "court mein",
    "consumer forum", "escalate karo", "kahan jaun", "kahan jaye",
    "gro la", "court la",
    "yaarel solluvadhu", "gro kitta",
}

_INTENT_LEGAL = {
    "lawyer", "advocate", "legal", "nalsa", "free legal", "legal aid",
    "can't afford lawyer", "no money", "free help", "legal support",
    "slsa", "state legal",
    "vakeel", "vakil", "muft madad", "free madad", "legal sahayata",
    "paisa nahi", "afford nahi", "muft vakeel", "kanoon madad",
    "muft sahayya", "legal sahayya",
    "illada udavi", "legal udavi", "panam illai",
}

_INTENT_FINANCIAL = {
    "ngo", "financial help", "money", "fund", "ayushman", "pmjay",
    "treatment cost", "can't afford", "afford treatment", "help pay",
    "crowdfund", "impactguru", "hospital bill", "scheme", "government scheme",
    "paisa chahiye", "madad chahiye", "ayushman bharat",
    "treatment ka paisa", "sarkari madad", "fund chahiye",
    "paisa pahije", "madad pahije", "treatment cha paisa",
    "panam venum", "udavi venum", "treatment panam", "arasaangam",
}

_INTENT_LEARN = {
    "what is", "explain", "meaning", "define", "how does", "tell me about",
    "educate", "learn", "understand", "teach",
    "kya hota hai", "kya hai", "matlab", "samjhao", "batao", "sikhaao",
    "kay aahe", "samjava", "shikhava",
    "enna", "viLakku", "arththam", "puriya",
}


def _matches(q: str, intent_set: set) -> bool:
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

    lang = lang if lang in _SUPPORTED_LANGS else "en"

    if session_id:
        session = get_session(session_id)
        if not session:
            return ReportChatResponse(answer=_session_not_found_msg(lang))
        report_data = get_report_data(session_id)
        history     = get_history(session_id, max_turns=_MAX_HISTORY_TURNS)
    else:
        if not report_data:
            return ReportChatResponse(answer=_no_report_msg(lang))
        history = []

    if not report_data:
        return ReportChatResponse(answer=_no_report_msg(lang))

    prompt = report_chat_prompt(report_data, history, user_question, lang=lang)

    raw = generate(
    prompt, model, tokenizer,
    max_new_tokens=450, json_mode=False, temperature=0.35,
)
    print(f"DEBUG raw='{raw}'")  # ← add this

    answer = raw.strip() if raw and raw.strip() else ""

    for prefix in ("Answer:", "ANSWER:", "Assistant:", "ASSISTANT:", "ANSWER:\n"):
        if answer.startswith(prefix):
            answer = answer[len(prefix):].strip()
            break

    for marker in ("USER QUESTION:", "CONVERSATION HISTORY:", "REPORT TYPE:", "REPORT DATA:"):
        idx = answer.find(marker)
        if idx > 20:
            answer = answer[:idx].strip()

    if len(answer) < 8:
        print(f"⚠ LLM answer too short ({len(answer)}) — deterministic fallback")
        answer = _build_fallback_answer(user_question, report_data, lang)

    if session_id:
        add_message(session_id, "user",      user_question)
        add_message(session_id, "assistant", answer)

    sources = _extract_sources(answer, report_data)
    return ReportChatResponse(answer=answer, session_id=session_id, sources=sources)


# ══════════════════════════════════════════════════════════════════════════════
# FALLBACK ROUTER
# ══════════════════════════════════════════════════════════════════════════════

def _build_fallback_answer(question: str, report: dict, lang: str = "en") -> str:
    q = question.lower()

    # Cross-cutting intents checked FIRST (work regardless of report type)
    if _matches(q, _INTENT_ESCALATION):
        return _escalation_answer(lang)
    if _matches(q, _INTENT_LEGAL):
        return _legal_aid_answer(lang)
    if _matches(q, _INTENT_FINANCIAL):
        return _financial_support_answer(lang)
    if _matches(q, _INTENT_LEARN):
        return _learn_answer(q, lang)

    is_prepurchase = "clause_risk" in report and "appeal_strength" not in report
    return _prepurchase_fallback(q, report, lang) if is_prepurchase else _audit_fallback(q, report, lang)


# ══════════════════════════════════════════════════════════════════════════════
# PRE-PURCHASE FALLBACK
# ══════════════════════════════════════════════════════════════════════════════

def _prepurchase_fallback(q: str, report: dict, lang: str) -> str:
    score  = round(float(report.get("score_breakdown", {}).get("adjusted_score", 0)))
    rating = report.get("overall_policy_rating", "Unknown")
    risk   = report.get("clause_risk", {})
    high   = [k.replace("_", " ") for k, v in risk.items() if v == "High Risk"]
    mod    = [k.replace("_", " ") for k, v in risk.items() if v == "Moderate Risk"]
    comply = report.get("irdai_compliance", {}).get("compliance_rating", "Unknown")
    broker = report.get("broker_risk_analysis", {}).get("structural_risk_level", "Unknown")

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

    return t("generic", lang, score=score, rating=rating,
             high=", ".join(high) or "none", comply=comply, broker=broker)


# ══════════════════════════════════════════════════════════════════════════════
# AUDIT FALLBACK
# ══════════════════════════════════════════════════════════════════════════════

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
    return t("audit_generic", lang, why=why, clause=clause, alignment=alignment,
         label=label, pct=pct, strong=st, weak=wk)


# ══════════════════════════════════════════════════════════════════════════════
# CROSS-CUTTING ANSWER FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def _escalation_answer(lang: str) -> str:
    answers = {
        "en": (
            "After a claim rejection, follow these 4 steps:\n\n"
            "1. GRO — File written complaint with your insurer's Grievance "
            "Redressal Officer within 15 days. Every insurer must have one "
            "by IRDAI rules.\n\n"
            "2. IRDAI IGMS — If GRO doesn't resolve in 15 days, file at "
            "igms.irda.gov.in. Free and online.\n\n"
            "3. Insurance Ombudsman — Free, binding for claims up to ₹50 lakhs. "
            "Must file within 1 year of rejection. Find your office at "
            "cioins.co.in.\n\n"
            "4. Consumer Court — For claims above ₹50 lakhs or if Ombudsman "
            "fails. District forum handles up to ₹1 crore. "
            "You can appear without a lawyer."
        ),
        "hi": (
            "Claim reject hone ke baad ye 4 steps follow karein:\n\n"
            "1. GRO — 15 din ke andar insurer ke Grievance Redressal Officer "
            "ko written complaint bhejein.\n\n"
            "2. IRDAI IGMS — GRO 15 din mein resolve nahi karta to "
            "igms.irda.gov.in par complaint darj karein.\n\n"
            "3. Insurance Ombudsman — ₹50 lakh tak ke claims ke liye free "
            "aur binding. 1 saal ke andar file karein. cioins.co.in.\n\n"
            "4. Consumer Court — ₹1 crore tak District Forum. "
            "Vakeel ke bina bhi ja sakte hain."
        ),
        "mr": (
            "Claim nakaral'yanantara he 4 steps follow kara:\n\n"
            "1. GRO — 15 divsat GRO la written takraar kara.\n\n"
            "2. IRDAI IGMS — igms.irda.gov.in var takraar nondava.\n\n"
            "3. Insurance Ombudsman — ₹50 lakh paryant free ani binding. "
            "cioins.co.in var office shoda.\n\n"
            "4. Consumer Court — ₹1 crore paryant District Forum."
        ),
        "ta": (
            "Claim niraakariththal pozhudhu intha 4 padikaLai pinthudungal:\n\n"
            "1. GRO — 15 naaLukkuL GRO kitta munaippai seyyungal.\n\n"
            "2. IRDAI IGMS — igms.irda.gov.in il padhividu seyyungal.\n\n"
            "3. Insurance Ombudsman — ₹50 latcham varai ilaiyaadhu. "
            "cioins.co.in il office kandupidiungal.\n\n"
            "4. Consumer Court — ₹1 kodi varai District Forum."
        ),
    }
    return answers.get(lang, answers["en"])


def _legal_aid_answer(lang: str) -> str:
    answers = {
        "en": (
            "Two options depending on your situation:\n\n"
            "FREE LEGAL AID — Eligible if:\n"
            "• Annual income below ₹3 lakhs\n"
            "• Senior citizen or person with disability\n"
            "• SC/ST community member\n"
            "• Woman (in most states)\n\n"
            "Apply at: NALSA — nalsa.nic.in\n"
            "Or visit your nearest District Legal Services Authority (DLSA).\n\n"
            "PAID LEGAL HELP — Consumer cases at District Forum typically "
            "cost ₹5,000–₹15,000. You can also appear yourself for free."
        ),
        "hi": (
            "2 options:\n\n"
            "FREE LEGAL AID — Eligible hain agar:\n"
            "• Saalana aay ₹3 lakh se kam\n"
            "• Senior citizen ya divyang\n"
            "• SC/ST samudaay se\n"
            "• Mahila\n\n"
            "Apply: NALSA — nalsa.nic.in ya nzdiki DLSA jaayein.\n\n"
            "PAID VAKEEL — District Forum mein ₹5,000–₹15,000 fees. "
            "Aap khud bhi ja sakte hain — free hai."
        ),
        "mr": (
            "2 paryaya:\n\n"
            "MUFT LEGAL SAHAYYA — Paatra ahat jara:\n"
            "• Varshik utpanna ₹3 lakh peksha kami\n"
            "• Jeshthanagrik kiva divyang\n"
            "• SC/ST samudayatil\n"
            "• Mahila\n\n"
            "Arj: NALSA — nalsa.nic.in kiva DLSA la bheta dya.\n\n"
            "PAID VAKEEL — District Forum madhye ₹5,000–₹15,000 fees."
        ),
        "ta": (
            "2 vaaippugal:\n\n"
            "ILLAIYADHA LEGAL UDAVI — Thagaruvaai aaval:\n"
            "• Varumanam ₹3 latchathukkum kammaana\n"
            "• Mooththavar athava vikalaanggi\n"
            "• SC/ST samuudam\n"
            "• Penn\n\n"
            "Viynthu: NALSA — nalsa.nic.in athavaa DLSA vai sandiyungal.\n\n"
            "PAID VAKEEL — District Forum il ₹5,000–₹15,000 kaattaNam."
        ),
    }
    return answers.get(lang, answers["en"])


def _financial_support_answer(lang: str) -> str:
    answers = {
        "en": (
            "3 sources of financial help when your claim is rejected:\n\n"
            "1. GOVERNMENT SCHEMES\n"
            "• PM-JAY (Ayushman Bharat) — ₹5 lakhs/year per family. "
            "Check eligibility at pmjay.gov.in.\n"
            "• State schemes: Maharashtra MJPJAY, Delhi Arogya Kosh, "
            "Tamil Nadu CM Health Insurance Scheme.\n\n"
            "2. VERIFIED NGOs\n"
            "• Tata Memorial Hospital Patient Aid Fund — cancer treatment\n"
            "• HelpAge India — senior citizens (helpageindia.org)\n"
            "• Give India — 200+ verified NGOs (give.do)\n"
            "• ImpactGuru — crowdfunding for medical emergencies\n\n"
            "3. HOSPITAL SUPPORT\n"
            "Most government hospitals have a patient welfare committee "
            "that can waive or reduce bills. Ask at the social work department."
        ),
        "hi": (
            "3 sources:\n\n"
            "1. SARKARI YOJANAYEN\n"
            "• PM-JAY — ₹5 lakh/saal. pmjay.gov.in par check karein.\n"
            "• Maharashtra MJPJAY, Delhi Arogya Kosh.\n\n"
            "2. VERIFIED NGOs\n"
            "• Tata Memorial Patient Aid Fund\n"
            "• HelpAge India\n"
            "• Give India (give.do)\n"
            "• ImpactGuru\n\n"
            "3. HOSPITAL SUPPORT\n"
            "Patient welfare committee bill maaf kar sakti hai. "
            "Social work department mein poochein."
        ),
        "mr": (
            "3 strot:\n\n"
            "1. SARKARI YOJANA\n"
            "• PM-JAY — ₹5 lakh/varsha. pmjay.gov.in var tapasa.\n"
            "• Maharashtra MJPJAY.\n\n"
            "2. VERIFIED NGOs\n"
            "• Tata Memorial Patient Aid Fund\n"
            "• HelpAge India\n"
            "• Give India (give.do)\n"
            "• ImpactGuru\n\n"
            "3. HOSPITAL SUPPORT\n"
            "Patient welfare committee bill maaf karu shakate."
        ),
        "ta": (
            "3 vazhi:\n\n"
            "1. ARASAANGKA THIITTAGAL\n"
            "• PM-JAY — ₹5 latch/varudham. pmjay.gov.in il paarkungal.\n"
            "• Tamil Nadu CM Health Insurance Scheme.\n\n"
            "2. VERIFIED NGOs\n"
            "• Tata Memorial Patient Aid Fund\n"
            "• HelpAge India\n"
            "• Give India (give.do)\n"
            "• ImpactGuru\n\n"
            "3. HOSPITAL SUPPORT\n"
            "Patient welfare committee bill kuRaikka mudiyum."
        ),
    }
    return answers.get(lang, answers["en"])


def _learn_answer(q: str, lang: str) -> str:
    topics = {
        "waiting period": {
            "en": (
                "A waiting period is a time after buying insurance during which "
                "certain claims are not covered. Standard: 30 days for most illnesses. "
                "Pre-existing disease: up to 48 months (IRDAI maximum). "
                "Specific diseases like hernia or cataract: typically 1–2 years. "
                "Accidents are always covered immediately — no waiting period."
            ),
            "hi": (
                "Waiting period wo samay hai jab policy kharidne ke baad kuch "
                "bimariyon ka claim nahi kar sakte. Aam bimariyon ke liye 30 din. "
                "Pre-existing disease ke liye 48 mahine tak. "
                "Accident hamesha turant cover hota hai."
            ),
            "mr": (
                "Waiting period mhanje policy ghetal'yanantara kaahi aajaaranvar "
                "claim karu shakat nahi. Saamannya sathi 30 divas. "
                "Pre-existing saathe 48 mahine. Apaghat turant cover hoto."
            ),
            "ta": (
                "Waiting period enpadhu kaapaattu vaangiya piragu sila noi "
                "kaLukkhu claim seiya mudiyaadha kaalam. Podhuvaan 30 naal. "
                "Pre-existing noikku 48 maadham varai. Vilappugal edaiyindri cover."
            ),
        },
        "pre-existing": {
            "en": (
                "A pre-existing disease is any condition you had before buying "
                "the policy — diagnosed or symptomatic. Insurers can exclude it "
                "for up to 48 months under IRDAI rules. After the 8-year moratorium, "
                "no claim can be rejected for pre-existing disease even if undisclosed."
            ),
            "hi": (
                "Pre-existing disease wo bimari hai jo policy kharidne se pehle thi. "
                "IRDAI ke niyam ke anusaar insurer 48 mahine tak cover nahi kar sakta. "
                "8 saal baad koi bhi claim pre-existing ke naam par reject nahi ho sakta."
            ),
            "mr": (
                "Pre-existing disease mhanje policy ghenyapurvee asleleli konitihi sthiti. "
                "IRDAI niyamanusaar 48 mahinyaparyant cover nahi karu shaktat. "
                "8 varshanantara pre-existing kaarnane claim nakarau shakat nahi."
            ),
            "ta": (
                "Pre-existing noi enpadhu policy vaanguvadharku munbu iruntha edhaavaadhu nilai. "
                "IRDAI vidhigal paadi 48 maadham varai cover seiyamal irukkalaam. "
                "8 varudam piragu pre-existing karanamaaaga claim maRukka mudiyaadhu."
            ),
        },
        "co-payment": {
            "en": (
                "Co-payment means you pay a fixed percentage of every claim. "
                "Example: 20% co-pay on a ₹5 lakh claim — you pay ₹1 lakh, "
                "insurer pays ₹4 lakh. Senior citizen policies often carry higher co-pay. "
                "Avoid high co-pay plans if you can."
            ),
            "hi": (
                "Co-payment matlab aap har claim ka ek fixed percentage khud bharte hain. "
                "20% co-pay par ₹5 lakh claim mein aap ₹1 lakh denge, insurer ₹4 lakh dega. "
                "Senior citizen policies mein zyada co-pay hota hai."
            ),
            "mr": (
                "Co-payment mhanje tumhi pratyek claim cha tharavlela tekawaari bhara. "
                "20% co-pay madhe ₹5 lakh sathi tumhi ₹1 lakh bharal, insurer ₹4 lakh bharail."
            ),
            "ta": (
                "Co-payment enpadhu neengkaL odhvoru claim il oru nireNa sadhaveetham selutthuvathu. "
                "20% co-pay udaiya ₹5 latcham claim il neengkaL ₹1 latcham seluttuveergkaL."
            ),
        },
        "sum insured": {
            "en": (
                "Sum insured is the maximum your insurer pays in a policy year. "
                "Choose based on your city — metro hospital costs are 2–3x higher "
                "than tier-2 cities. Minimum recommended: ₹10 lakhs for a metro family."
            ),
            "hi": (
                "Sum insured wo maximum amount hai jo insurer ek policy saal mein dega. "
                "Metro cities mein ₹10 lakh minimum recommended hai."
            ),
            "mr": (
                "Sum insured mhanje insurer eka policy varshat jasta jaast kiti bharail te. "
                "Metro shaharant family sathi kinaan ₹10 lakh asave."
            ),
            "ta": (
                "Sum insured enpadhu oru policy aaNdil kaapaattu nirkkaththavar tharum thokai. "
                "Metro nagaragalil kudumbathukkhu kinaintha paksha ₹10 latcham thevai."
            ),
        },
        "room rent": {
            "en": (
                "Room rent sublimit caps the insurer's daily room payment. "
                "Example: 1% of ₹5 lakh = ₹5,000/day cap. If you stay in a ₹10,000/day "
                "room, the insurer applies proportionate deduction to your ENTIRE bill — "
                "not just the room cost. Always choose a plan with no room rent cap."
            ),
            "hi": (
                "Room rent sublimit matlab insurer rozana kitna dega. "
                "1% of ₹5 lakh = ₹5,000/din. ₹10,000 room mein ruke to "
                "poora bill 50% kam ho jaata hai. Room rent cap wali policy se bachein."
            ),
            "mr": (
                "Room rent sublimit mhanje insurer rozchi kiti room sathi deil. "
                "1% of ₹5 lakh = ₹5,000/divas. ₹10,000 chi room ghetal tar "
                "sampurna bill 50% kami hotey."
            ),
            "ta": (
                "Room rent sublimit enpadhu insurer naaLukkoru arai vaadaikkhu tharum thokai. "
                "1% of ₹5 latcham = ₹5,000/naal. ₹10,000 arai edutthal muzhuk bill 50% kuRaiyum."
            ),
        },
        "irdai": {
            "en": (
                "IRDAI regulates all insurance companies in India. "
                "Key policyholder rights: 15-day free look period, grievance redressal "
                "within 15 days, portability without penalty, and the 8-year moratorium "
                "on pre-existing disease rejections. Official site: irdai.gov.in"
            ),
            "hi": (
                "IRDAI sabhi insurance companies ko regulate karti hai. "
                "Mukhya adhikar: 15 din ka free look period, 15 din mein grievance, "
                "bina penalty ke portability, 8 saal ka moratorium. irdai.gov.in"
            ),
            "mr": (
                "IRDAI sarva vima kampanyanna niyantrit kanariya sanstha ahe. "
                "Mukhya hakka: 15 divas free look, 15 divaat takraar, "
                "penalty shivay portability, 8 varsha moratorium. irdai.gov.in"
            ),
            "ta": (
                "IRDAI arasaangka kaapaattu vidhimurai amaippu. "
                "Mukhya urimaigal: 15 naal free look, 15 naaLil pulaampudhal, "
                "thadai indriya portability, 8 varudam moratorium. irdai.gov.in"
            ),
        },
    }

    for topic_key, translations in topics.items():
        if topic_key in q:
            return translations.get(lang, translations["en"])

    generic = {
        "en": (
            "I can explain: waiting period, pre-existing disease, co-payment, "
            "sum insured, room rent sublimit, IRDAI rights, escalation steps, "
            "free legal aid, and financial support options. What would you like to know?"
        ),
        "hi": (
            "Mein explain kar sakta hun: waiting period, pre-existing disease, "
            "co-payment, sum insured, room rent, IRDAI rights, escalation, "
            "free legal aid. Kya jaanna chahte hain?"
        ),
        "mr": (
            "Mee saangoo shakto: waiting period, pre-existing disease, co-payment, "
            "sum insured, room rent, IRDAI hakka, escalation, muft legal sahayya. "
            "Kay saangaychay?"
        ),
        "ta": (
            "Naan viLakkam tharava mudiyum: waiting period, pre-existing noi, "
            "co-payment, sum insured, room rent, IRDAI urimai, escalation, "
            "illaiyadha legal udavi. Enna theriya vendum?"
        ),
    }
    return generic.get(lang, generic["en"])


# ══════════════════════════════════════════════════════════════════════════════
# SYSTEM MESSAGES
# ══════════════════════════════════════════════════════════════════════════════

def _session_not_found_msg(lang: str) -> str:
    msgs = {
        "en": "Session not found or expired. Please start a new chat.",
        "hi": "सत्र नहीं मिला या समाप्त हो गया। कृपया नई चैट शुरू करें।",
        "mr": "सत्र सापडले नाही किंवा कालबाह्य झाले. कृपया नवीन चॅट सुरू करा.",
        "ta": "அமர்வு கண்டறியப்படவில்லை. புதிய அரட்டையை தொடங்கவும்.",
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


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE EXTRACTION
# ══════════════════════════════════════════════════════════════════════════════

def _extract_sources(text: str, report_data: dict) -> list[str]:
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
        ("nalsa",          "National Legal Services Authority Act 1987"),
        ("pm-jay",         "Pradhan Mantri Jan Arogya Yojana"),
        ("ayushman",       "Pradhan Mantri Jan Arogya Yojana"),
    ]
    for keyword, label in checks:
        if keyword in lower and label not in refs:
            refs.append(label)
        if len(refs) >= 3:
            break
    return refs