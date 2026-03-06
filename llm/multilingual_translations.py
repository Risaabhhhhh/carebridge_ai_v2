# llm/multilingual_translations.py
#
# Pure constants file — NO imports from llm/ or services/
# Provides: t(), SPEECH_LANG_CODES
# Used by: report_chat_service.py (import this BEFORE report_chat_prompt)

# ══════════════════════════════════════════════════════════════════════════════
# SPEECH LANGUAGE CODES  (lang_key → BCP-47 / TTS code)
# ══════════════════════════════════════════════════════════════════════════════

SPEECH_LANG_CODES: dict[str, str] = {
    "en": "en-IN",
    "hi": "hi-IN",
    "mr": "mr-IN",
    "ta": "ta-IN",
}

# ══════════════════════════════════════════════════════════════════════════════
# SYSTEM LANGUAGE INSTRUCTION  (injected into the LLM system prompt)
# ══════════════════════════════════════════════════════════════════════════════

SYSTEM_LANG_INSTRUCTION: dict[str, str] = {
    "en": "Respond in English. Be clear and concise.",
    "hi": "Hindi mein jawab dein. Saral aur seedhi bhasha use karein.",
    "mr": "Marathi madhye uttar dya. Saral aani spasht bhasha vapara.",
    "ta": "Tamil il padhil solunga. Theliva maRRum neriyan mozhi upayogippadhu.",
}

# ══════════════════════════════════════════════════════════════════════════════
# TRANSLATION TABLE
# Keys used by report_chat_service.py fallback functions.
# Each entry: { "en": "...", "hi": "...", "mr": "...", "ta": "..." }
# Supports .format(**kwargs) placeholders.
# ══════════════════════════════════════════════════════════════════════════════

_TRANSLATIONS: dict[str, dict[str, str]] = {

    # ── Pre-purchase: Risk ────────────────────────────────────────────────────

    "risk": {
        "en": (
            "High-risk clauses found: {high}. "
            "Policy score: {score}/100 ({rating}). "
            "IRDAI compliance: {comply}. "
            "Negotiate or avoid these clauses before buying."
        ),
        "hi": (
            "High-risk clauses mile: {high}. "
            "Policy score: {score}/100 ({rating}). "
            "IRDAI compliance: {comply}. "
            "Kharidne se pehle in clauses par negotiate karein."
        ),
        "mr": (
            "High-risk clauses aadhaLle: {high}. "
            "Policy score: {score}/100 ({rating}). "
            "IRDAI compliance: {comply}. "
            "Kharidnyapurvee ya clauses var negotiate kara."
        ),
        "ta": (
            "Adhika aapathu clause kaL: {high}. "
            "Policy score: {score}/100 ({rating}). "
            "IRDAI iNakkam: {comply}. "
            "Vangunmunbu intha clause kaLai pEsi mudindhukkoLLungkaL."
        ),
    },

    "no_high_risk": {
        "en": (
            "No high-risk clauses found. Moderate risks: {mod}. "
            "Score: {score}/100 ({rating}). Overall a reasonable policy."
        ),
        "hi": (
            "Koi high-risk clause nahi mila. Moderate risks: {mod}. "
            "Score: {score}/100 ({rating}). Yeh policy kaafi theek hai."
        ),
        "mr": (
            "Konitihi high-risk clause sapadla nahi. Moderate risks: {mod}. "
            "Score: {score}/100 ({rating}). Hi policy baari theek ahe."
        ),
        "ta": (
            "Adhika aapathu clause illai. Nadutthara aapathu: {mod}. "
            "Score: {score}/100 ({rating}). Ovvaara policy paravaayillai."
        ),
    },

    # ── Pre-purchase: Waiting Period ─────────────────────────────────────────

    "waiting_high": {
        "en": "Waiting period is HIGH RISK — likely 2–4 years for pre-existing diseases. Accidents are covered immediately.",
        "hi": "Waiting period HIGH RISK hai — pre-existing diseases ke liye 2–4 saal. Accident turant cover hota hai.",
        "mr": "Waiting period HIGH RISK ahe — pre-existing sathi 2–4 varsha. Apaghat turant cover hoto.",
        "ta": "Waiting period ADHIKA AAPATHU — pre-existing noikku 2–4 varudham. Vilappugal edaiyindri cover.",
    },

    "waiting_moderate": {
        "en": "Waiting period is MODERATE RISK — typically 1–2 years for specific illnesses. Review the policy document carefully.",
        "hi": "Waiting period MODERATE RISK — specific bimariyon ke liye 1–2 saal. Policy document dhyan se padhein.",
        "mr": "Waiting period MODERATE RISK — specific aajaaranvar 1–2 varsha. Policy document kaLjipurvak vaacha.",
        "ta": "Waiting period NADUTTHARA AAPATHU — kudripittha noikku 1–2 varudham. Policy aavanatthai kavanamaaaka padiyungkaL.",
    },

    "waiting_low": {
        "en": "Waiting period is LOW RISK — standard 30-day initial wait, which is normal. Pre-existing disease coverage after 1 year.",
        "hi": "Waiting period LOW RISK — standard 30 din ki initial wait, jo normal hai.",
        "mr": "Waiting period LOW RISK — standard 30 divas, jo samannya ahe.",
        "ta": "Waiting period KURAI AAPATHU — saadharana 30 naal, ithu iyal vazhakku.",
    },

    "waiting_not_found": {
        "en": "Waiting period details were not detected in this policy. Ask the insurer for the exact waiting period schedule before buying.",
        "hi": "Is policy mein waiting period details detect nahi hua. Kharidne se pehle insurer se poochein.",
        "mr": "Ya policy madhe waiting period sapadla nahi. Kharidnyapurvee insurer la vicharaa.",
        "ta": "Intha policy il waiting period vilaarath therivikkapadavillai. Vangumunbu insurer kitta ketungkaL.",
    },

    # ── Pre-purchase: Compliance ──────────────────────────────────────────────

    "compliance": {
        "en": "IRDAI compliance rating: {comply}. Broker/structural risk: {broker}. A lower compliance rating means higher chance of claim disputes.",
        "hi": "IRDAI compliance rating: {comply}. Broker risk: {broker}. Kam compliance rating matlab claim mein zyada problem.",
        "mr": "IRDAI compliance rating: {comply}. Broker risk: {broker}. Kami compliance mhanje claim madhye jaast samashya.",
        "ta": "IRDAI iNakkam: {comply}. Broker aapathu: {broker}. Kurai iNakkam endral claim vil jaasta siramam.",
    },

    # ── Pre-purchase: Buy decision ────────────────────────────────────────────

    "buy_strong": {
        "en": "Score {score}/100 ({rating}) — Strong policy. Broker risk: {broker}. Generally recommended, but always read the fine print.",
        "hi": "Score {score}/100 ({rating}) — Mazboot policy. Broker risk: {broker}. Generally recommend ki jaati hai.",
        "mr": "Score {score}/100 ({rating}) — Changle policy. Broker risk: {broker}. Sadhaaranpane shifiaarash keleli.",
        "ta": "Score {score}/100 ({rating}) — Valimaiyaana policy. Broker aapathu: {broker}. Podhuvaan paravaayillai.",
    },

    "buy_moderate": {
        "en": "Score {score}/100 ({rating}) — Average policy. Broker risk: {broker}. Negotiate high-risk clauses before signing.",
        "hi": "Score {score}/100 ({rating}) — Average policy. Broker risk: {broker}. Sign karne se pehle high-risk clauses par negotiate karein.",
        "mr": "Score {score}/100 ({rating}) — Saadhaaran policy. Broker risk: {broker}. Sign karayapurvee high-risk clauses sathi negotiate kara.",
        "ta": "Score {score}/100 ({rating}) — Saadharana policy. Broker aapathu: {broker}. Kainnamaadumunbu high-risk clause pEsungkaL.",
    },

    "buy_weak": {
        "en": "Score {score}/100 ({rating}) — Weak policy. Broker risk: {broker}. Not recommended — consider alternatives before buying.",
        "hi": "Score {score}/100 ({rating}) — Kamzor policy. Broker risk: {broker}. Recommend nahi — doosre options dekhein.",
        "mr": "Score {score}/100 ({rating}) — Kamkuvat policy. Broker risk: {broker}. Shifiaarash nahi — paryaay shoda.",
        "ta": "Score {score}/100 ({rating}) — Valiyatra policy. Broker aapathu: {broker}. Paravaayillai illai — marru option paarkungkaL.",
    },

    # ── Pre-purchase: Negotiate ───────────────────────────────────────────────

    "negotiate_none": {
        "en": "No high-risk clauses found to negotiate. The policy looks structurally sound.",
        "hi": "Negotiate karne ke liye koi high-risk clause nahi mila. Policy theek lagti hai.",
        "mr": "Negotiate karnyasathi konitihi high-risk clause sapadla nahi. Policy saaMgalyavar theek ahe.",
        "ta": "Pesi mudivu seiya adhika aapathu clause illai. Policy nallaa therikindradhu.",
    },

    "negotiate_high": {
        "en": "Before buying, ask the insurer to clarify or waive: {high}. Get any changes in writing.",
        "hi": "Kharidne se pehle insurer se in clauses par clarify karein: {high}. Koi bhi badlaav writing mein lein.",
        "mr": "Kharidnyapurvee insurer kade ya clauses baddal vicharaa: {high}. Konitihi badal lekhi swaroopaant ghya.",
        "ta": "Vangumunbu insurer kitta intha clause kaLai theeLppaduththungkaL: {high}. Yedhuvum maatramum ezhutthil vaangungkaL.",
    },

    # ── Pre-purchase: Not Found / Missing ─────────────────────────────────────

    "all_found": {
        "en": "All standard clauses were detected in this policy. No missing sections found.",
        "hi": "Is policy mein sabhi standard clauses detect hue. Koi missing section nahi mila.",
        "mr": "Ya policy madhe sarva samannya clauses sapadlle. Konitihi missing section sapadla nahi.",
        "ta": "Intha policy il ellaa saadharana clause kaLum kandupidikkapaddu. Yaarum kutRaiyillai.",
    },

    "not_found_missing": {
        "en": "These clauses were not detected: {missing}. Ask the insurer specifically about these before buying.",
        "hi": "Ye clauses detect nahi hue: {missing}. Kharidne se pehle insurer se specifically poochein.",
        "mr": "He clauses sapadlle nahi: {missing}. Kharidnyapurvee insurer la specifically vicharaa.",
        "ta": "Intha clause kaL kandupidikkapadavillai: {missing}. Vangumunbu insurer kitta kudrippittu ketungkaL.",
    },

    # ── Pre-purchase: Generic fallback ────────────────────────────────────────

    "generic": {
        "en": (
            "Policy score: {score}/100 ({rating}). "
            "High-risk areas: {high}. "
            "IRDAI compliance: {comply}. "
            "Broker risk: {broker}. "
            "Ask me about risks, waiting period, compliance, or whether to buy."
        ),
        "hi": (
            "Policy score: {score}/100 ({rating}). "
            "High-risk areas: {high}. "
            "IRDAI compliance: {comply}. "
            "Broker risk: {broker}. "
            "Risk, waiting period, compliance ya kharidne ke baare mein poochein."
        ),
        "mr": (
            "Policy score: {score}/100 ({rating}). "
            "High-risk areas: {high}. "
            "IRDAI compliance: {comply}. "
            "Broker risk: {broker}. "
            "Risk, waiting period, compliance kinva kharidnyabaddal vicharaa."
        ),
        "ta": (
            "Policy score: {score}/100 ({rating}). "
            "Adhika aapathu: {high}. "
            "IRDAI iNakkam: {comply}. "
            "Broker aapathu: {broker}. "
            "Aapathu, waiting period, iNakkam pathi ketungkaL."
        ),
    },

    # ── Audit: Appeal strength ────────────────────────────────────────────────

    "appeal_strong": {
        "en": "Appeal strength: {label} ({pct}%). {reasoning} — Strong chance of success. File immediately.",
        "hi": "Appeal strength: {label} ({pct}%). {reasoning} — Jeetne ki acchi umeed. Turant file karein.",
        "mr": "Appeal strength: {label} ({pct}%). {reasoning} — Yash milnyachi changle shaktata. Laagalach file kara.",
        "ta": "Appeal valimai: {label} ({pct}%). {reasoning} — Vetri kittum vaaippu nannaa uLLadhu. Udanae file seyyungkaL.",
    },

    "appeal_moderate": {
        "en": "Appeal strength: {label} ({pct}%). {reasoning} — Moderate chance. Strengthen your evidence before filing.",
        "hi": "Appeal strength: {label} ({pct}%). {reasoning} — Moderate chance. File karne se pehle evidence mazboot karein.",
        "mr": "Appeal strength: {label} ({pct}%). {reasoning} — Moderate chance. File karayapurvee evidence mazboot kara.",
        "ta": "Appeal valimai: {label} ({pct}%). {reasoning} — Nadutthara vaaippu. File seyyumunbu saatchi valimai seyyungkaL.",
    },

    "appeal_weak": {
        "en": "Appeal strength: {label} ({pct}%). {reasoning} — Low chance currently. Gather more evidence before appealing.",
        "hi": "Appeal strength: {label} ({pct}%). {reasoning} — Abhi kam chance. Appeal karne se pehle aur evidence ikathe karein.",
        "mr": "Appeal strength: {label} ({pct}%). {reasoning} — Kam chance. Appeal karayapurvee jaast evidence gola kara.",
        "ta": "Appeal valimai: {label} ({pct}%). {reasoning} — Ippodhaikku kurai vaaippu. Muttrumunapu jaasta saatchi seRuungkaL.",
    },

    # ── Audit: Overturn / Evidence ────────────────────────────────────────────

    "overturn": {
        "en": "To strengthen your case, address these weak points: {weak}. Gather discharge summaries, doctor letters, and payment receipts.",
        "hi": "Case mazboot karne ke liye in weak points par dhyan dein: {weak}. Discharge summary, doctor letter aur receipts ikathe karein.",
        "mr": "Case mazboot karnyasathi ya weak points war lakssh dya: {weak}. Discharge summary, doctor patra aani receipts gola kara.",
        "ta": "Ungal vazhakkai valimaipaduththa intha kuraipaattukaLai tiruththungkaL: {weak}. Discharge summary, doctor kaitham, receipts seRuungkaL.",
    },

    # ── Audit: Moratorium ─────────────────────────────────────────────────────

    "moratorium": {
        "en": (
            "Under IRDAI's 8-year moratorium rule: after 8 continuous years of coverage, "
            "NO claim can be rejected for pre-existing disease — even if undisclosed at purchase. "
            "This applies to all health insurance policies in India."
        ),
        "hi": (
            "IRDAI ke 8-saal moratorium niyam ke anusar: 8 saal lagaataar policy rakhne ke baad, "
            "koi bhi claim pre-existing disease ke naam par reject nahi ho sakta — "
            "chahe kharidne ke waqt bataya na ho."
        ),
        "mr": (
            "IRDAI chya 8-varsha moratorium niyamanusaar: 8 varsha satat coverage nantara, "
            "konitihi claim pre-existing disease saathe nakarau shakat nahi — "
            "jaari kharidtana saangitle nasale tari."
        ),
        "ta": (
            "IRDAI in 8-varudham moratorium vidhipadi: 8 thodarmaana aaNdugaL coverage pirivu, "
            "pre-existing noi karanamaaaga yaarum claim maRukka mudiyaadhu — "
            "vaangiyapodhudhu sollaavidum paattu."
        ),
    },

    # ── Audit: Next Steps ─────────────────────────────────────────────────────

    "next_steps_dynamic": {
        "en": "Recommended next steps: {steps}",
        "hi": "Suggested next steps: {steps}",
        "mr": "Suchavlele pudhaache kadam: {steps}",
        "ta": "Aduththa padikaL: {steps}",
    },

    "next_steps_generic": {
        "en": (
            "Next steps after a claim rejection:\n"
            "1. File written complaint with insurer's GRO within 15 days.\n"
            "2. If unresolved, escalate to IRDAI IGMS (igms.irda.gov.in).\n"
            "3. Approach Insurance Ombudsman within 1 year (cioins.co.in).\n"
            "4. Consumer Court as last resort."
        ),
        "hi": (
            "Claim reject hone ke baad agle kadam:\n"
            "1. 15 din mein GRO ko written complaint.\n"
            "2. Resolve na ho to IRDAI IGMS (igms.irda.gov.in).\n"
            "3. 1 saal mein Insurance Ombudsman (cioins.co.in).\n"
            "4. Consumer Court antim vikalp."
        ),
        "mr": (
            "Claim nakaral'yanantara pudhaache kadam:\n"
            "1. 15 divsat GRO la written takraar.\n"
            "2. Resolve na jhaal tar IRDAI IGMS (igms.irda.gov.in).\n"
            "3. 1 varshaat Insurance Ombudsman (cioins.co.in).\n"
            "4. Consumer Court shaevtacha upaaY."
        ),
        "ta": (
            "Claim maRukkappattapodhudhu aduththa padikaL:\n"
            "1. 15 naaLukkuL GRO kitta ezhuthu pulaampudhal.\n"
            "2. Thiruvaadha endral IRDAI IGMS (igms.irda.gov.in).\n"
            "3. 1 varudhatthil Insurance Ombudsman (cioins.co.in).\n"
            "4. Consumer Court kadaisi vazhi."
        ),
    },

    # ── Audit: Ombudsman ──────────────────────────────────────────────────────

    "ombudsman": {
        "en": (
            "Insurance Ombudsman: Free, binding for claims up to ₹50 lakhs. "
            "Must file within 1 year of rejection. "
            "Find your nearest office at cioins.co.in. "
            "No lawyer needed."
        ),
        "hi": (
            "Insurance Ombudsman: ₹50 lakh tak ke claims ke liye free aur binding. "
            "Rejection ke 1 saal ke andar file karein. "
            "cioins.co.in par nzdiki office dhundhein."
        ),
        "mr": (
            "Insurance Ombudsman: ₹50 lakh paryantachya claims sathi free aur binding. "
            "Nakaral'yanantara 1 varshaat file kara. "
            "cioins.co.in var nzdiche office shoda."
        ),
        "ta": (
            "Insurance Ombudsman: ₹50 latcham varai ilaiyadhu, kattupaadaana. "
            "Maruthal piragu 1 varudhatthil file seyyungkaL. "
            "cioins.co.in il aduththa aluvalakam kaaNungkaL."
        ),
    },

    # ── Audit: Documents ──────────────────────────────────────────────────────

    "documents": {
        "en": (
            "Documents typically needed for a claim appeal:\n"
            "• Original rejection letter from insurer\n"
            "• Hospital discharge summary\n"
            "• All original bills and payment receipts\n"
            "• Doctor's certificate with diagnosis\n"
            "• Policy document copy\n"
            "• Any pre-authorization correspondence"
        ),
        "hi": (
            "Claim appeal ke liye aam tor par zaroori documents:\n"
            "• Insurer ka original rejection letter\n"
            "• Hospital discharge summary\n"
            "• Sabhi original bills aur receipts\n"
            "• Doctor ka diagnosis certificate\n"
            "• Policy document ki copy\n"
            "• Pre-authorization patra"
        ),
        "mr": (
            "Claim appeal sathi sadhaaranpane laaganaare documents:\n"
            "• Insurer cha original rejection letter\n"
            "• Hospital discharge summary\n"
            "• Sarva original bills aani receipts\n"
            "• Doctor cha diagnosis certificate\n"
            "• Policy document chi copy"
        ),
        "ta": (
            "Claim appeal seivatharku podhuvaan thaevaipadum aavanangkaL:\n"
            "• Insurer in original maRuppu kaitham\n"
            "• Hospital discharge summary\n"
            "• Aarikkai bills maRRum receipts\n"
            "• Doctor diagnosis sartipiket\n"
            "• Policy aavana nakal"
        ),
    },

    # ── Audit: Clause / Rejection reason ─────────────────────────────────────

    "clause_challengeable": {
        "en": (
            "Rejection reason: {why}. Clause detected: {clause}. "
            "Clause alignment: {alignment} — this clause may be challengeable. "
            "Consider filing an appeal with supporting medical evidence."
        ),
        "hi": (
            "Rejection reason: {why}. Clause: {clause}. "
            "Alignment: {alignment} — yeh clause challenge kiya ja sakta hai. "
            "Supporting medical evidence ke saath appeal file karein."
        ),
        "mr": (
            "Rejection kaaran: {why}. Clause: {clause}. "
            "Alignment: {alignment} — ha clause challenge karu shaktao. "
            "Medical evidence saathe appeal file kara."
        ),
        "ta": (
            "Maruthal karanam: {why}. Clause: {clause}. "
            "Clause iNakkam: {alignment} — intha clause-ai savalippikka mudiyum. "
            "Medical saatchi udaiya appeal file seyyungkaL."
        ),
    },

    "clause_firm": {
        "en": (
            "Rejection reason: {why}. Clause detected: {clause}. "
            "Clause alignment: {alignment} — the insurer's position appears strong. "
            "Seek a second legal opinion before deciding to appeal."
        ),
        "hi": (
            "Rejection reason: {why}. Clause: {clause}. "
            "Alignment: {alignment} — insurer ki position mazboot lagti hai. "
            "Appeal karne se pehle legal opinion lein."
        ),
        "mr": (
            "Rejection kaaran: {why}. Clause: {clause}. "
            "Alignment: {alignment} — insurer chi position mazboot ahe. "
            "Appeal karayapurvee legal opinion ghya."
        ),
        "ta": (
            "Maruthal karanam: {why}. Clause: {clause}. "
            "Clause iNakkam: {alignment} — insurer nillai valimaiyaanadu. "
            "Appeal seyyumunbu saadha legal katturai vaangungkaL."
        ),
    },

    # ── Audit: Generic fallback ───────────────────────────────────────────────
    # Note: "generic" key is reused — audit version has different placeholders.
    # report_chat_service.py calls t("generic", lang, ...) with audit kwargs when
    # in audit mode. We use a separate key to avoid collision.

    "audit_generic": {
        "en": (
            "Rejection reason: {why}. Clause: {clause}. "
            "Alignment: {alignment}. Appeal: {label} ({pct}%). "
            "Strong points: {strong}. Weak points: {weak}."
        ),
        "hi": (
            "Rejection reason: {why}. Clause: {clause}. "
            "Alignment: {alignment}. Appeal: {label} ({pct}%). "
            "Strong points: {strong}. Weak points: {weak}."
        ),
        "mr": (
            "Rejection kaaran: {why}. Clause: {clause}. "
            "Alignment: {alignment}. Appeal: {label} ({pct}%). "
            "Strong: {strong}. Weak: {weak}."
        ),
        "ta": (
            "Maruthal karanam: {why}. Clause: {clause}. "
            "Inaippidanam: {alignment}. Appeal: {label} ({pct}%). "
            "Valimaikaaram: {strong}. Kuraipaadu: {weak}."
        ),
    },

}


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def t(key: str, lang: str = "en", **kwargs) -> str:
    """
    Translate a message key into the requested language and format with kwargs.

    Usage:
        t("risk", "hi", high="room rent", score=55, rating="Average", comply="Partial")

    Falls back to "en" if lang not found, or returns the key itself as last resort.
    """
    entry = _TRANSLATIONS.get(key)
    if entry is None:
        # Unknown key — return a safe placeholder
        return f"[{key}]"

    template = entry.get(lang) or entry.get("en", f"[{key}]")

    if kwargs:
        try:
            return template.format(**kwargs)
        except KeyError:
            # Return unformatted template rather than crash
            return template

    return template

    _TRANSLATIONS: dict[str, dict[str, str]] = {
    "risk": {
        "en": "High-risk clauses found: {high}. Policy score: {score}/100 ({rating}). IRDAI compliance: {comply}. Negotiate or avoid these clauses before buying.",
        "hi": "High-risk clauses mile: {high}. Policy score: {score}/100 ({rating}). IRDAI compliance: {comply}. Kharidne se pehle in clauses par negotiate karein.",
        "mr": "High-risk clauses aadhaLle: {high}. Policy score: {score}/100 ({rating}). IRDAI compliance: {comply}. Kharidnyapurvee ya clauses var negotiate kara.",
        "ta": "Adhika aapathu clause kaL: {high}. Policy score: {score}/100 ({rating}). IRDAI iNakkam: {comply}. Vangunmunbu pEsi mudindhukkoLLungkaL.",
    },
    "no_high_risk": {
        "en": "No high-risk clauses found. Moderate risks: {mod}. Score: {score}/100 ({rating}). Overall a reasonable policy.",
        "hi": "Koi high-risk clause nahi mila. Moderate risks: {mod}. Score: {score}/100 ({rating}).",
        "mr": "Konitihi high-risk clause sapadla nahi. Moderate risks: {mod}. Score: {score}/100 ({rating}).",
        "ta": "Adhika aapathu clause illai. Nadutthara aapathu: {mod}. Score: {score}/100 ({rating}).",
    },
    "waiting_high": {
        "en": "Waiting period is HIGH RISK — likely 2–4 years for pre-existing diseases. Accidents are covered immediately.",
        "hi": "Waiting period HIGH RISK hai — pre-existing diseases ke liye 2–4 saal. Accident turant cover hota hai.",
        "mr": "Waiting period HIGH RISK ahe — pre-existing sathi 2–4 varsha. Apaghat turant cover hoto.",
        "ta": "Waiting period ADHIKA AAPATHU — pre-existing noikku 2–4 varudham. Vilappugal edaiyindri cover.",
    },
    "waiting_moderate": {
        "en": "Waiting period is MODERATE RISK — typically 1–2 years for specific illnesses. Review the policy document carefully.",
        "hi": "Waiting period MODERATE RISK — specific bimariyon ke liye 1–2 saal. Policy document dhyan se padhein.",
        "mr": "Waiting period MODERATE RISK — specific aajaaranvar 1–2 varsha. Policy document kaLjipurvak vaacha.",
        "ta": "Waiting period NADUTTHARA AAPATHU — kudripittha noikku 1–2 varudham.",
    },
    "waiting_low": {
        "en": "Waiting period is LOW RISK — standard 30-day initial wait. Pre-existing disease coverage after 1 year.",
        "hi": "Waiting period LOW RISK — standard 30 din ki initial wait, jo normal hai.",
        "mr": "Waiting period LOW RISK — standard 30 divas, jo samannya ahe.",
        "ta": "Waiting period KURAI AAPATHU — saadharana 30 naal, ithu iyal vazhakku.",
    },
    "waiting_not_found": {
        "en": "Waiting period details were not detected. Ask the insurer for the exact waiting period schedule before buying.",
        "hi": "Waiting period details detect nahi hua. Kharidne se pehle insurer se poochein.",
        "mr": "Waiting period sapadla nahi. Kharidnyapurvee insurer la vicharaa.",
        "ta": "Waiting period kandupidikkapadavillai. Vangumunbu insurer kitta ketungkaL.",
    },
    "compliance": {
        "en": "IRDAI compliance rating: {comply}. Broker/structural risk: {broker}. Lower compliance means higher chance of claim disputes.",
        "hi": "IRDAI compliance rating: {comply}. Broker risk: {broker}. Kam compliance matlab claim mein zyada problem.",
        "mr": "IRDAI compliance rating: {comply}. Broker risk: {broker}. Kami compliance mhanje claim madhye jaast samashya.",
        "ta": "IRDAI iNakkam: {comply}. Broker aapathu: {broker}. Kurai iNakkam endral claim vil jaasta siramam.",
    },
    "buy_strong": {
        "en": "Score {score}/100 ({rating}) — Strong policy. Broker risk: {broker}. Generally recommended, but always read the fine print.",
        "hi": "Score {score}/100 ({rating}) — Mazboot policy. Broker risk: {broker}. Generally recommend ki jaati hai.",
        "mr": "Score {score}/100 ({rating}) — Changle policy. Broker risk: {broker}. Sadhaaranpane shifiaarash keleli.",
        "ta": "Score {score}/100 ({rating}) — Valimaiyaana policy. Broker aapathu: {broker}. Podhuvaan paravaayillai.",
    },
    "buy_moderate": {
        "en": "Score {score}/100 ({rating}) — Average policy. Broker risk: {broker}. Negotiate high-risk clauses before signing.",
        "hi": "Score {score}/100 ({rating}) — Average policy. Broker risk: {broker}. Sign karne se pehle high-risk clauses negotiate karein.",
        "mr": "Score {score}/100 ({rating}) — Saadhaaran policy. Broker risk: {broker}. Sign karayapurvee negotiate kara.",
        "ta": "Score {score}/100 ({rating}) — Saadharana policy. Broker aapathu: {broker}. Kainnamaadumunbu pEsungkaL.",
    },
    "buy_weak": {
        "en": "Score {score}/100 ({rating}) — Weak policy. Broker risk: {broker}. Not recommended — consider alternatives.",
        "hi": "Score {score}/100 ({rating}) — Kamzor policy. Broker risk: {broker}. Recommend nahi — doosre options dekhein.",
        "mr": "Score {score}/100 ({rating}) — Kamkuvat policy. Broker risk: {broker}. Shifiaarash nahi — paryaay shoda.",
        "ta": "Score {score}/100 ({rating}) — Valiyatra policy. Broker aapathu: {broker}. Marru option paarkungkaL.",
    },
    "negotiate_none": {
        "en": "No high-risk clauses found to negotiate. The policy looks structurally sound.",
        "hi": "Negotiate karne ke liye koi high-risk clause nahi mila. Policy theek lagti hai.",
        "mr": "Negotiate karnyasathi konitihi high-risk clause sapadla nahi.",
        "ta": "Pesi mudivu seiya adhika aapathu clause illai.",
    },
    "negotiate_high": {
        "en": "Before buying, ask the insurer to clarify or waive: {high}. Get any changes in writing.",
        "hi": "Kharidne se pehle insurer se clarify karein: {high}. Koi bhi badlaav writing mein lein.",
        "mr": "Kharidnyapurvee insurer kade ya clauses baddal vicharaa: {high}.",
        "ta": "Vangumunbu insurer kitta theeLppaduththungkaL: {high}. Ezhutthil vaangungkaL.",
    },
    "all_found": {
        "en": "All standard clauses were detected. No missing sections found.",
        "hi": "Sabhi standard clauses detect hue. Koi missing section nahi mila.",
        "mr": "Sarva samannya clauses sapadlle. Konitihi missing section sapadla nahi.",
        "ta": "Ellaa saadharana clause kaLum kandupidikkapaddu.",
    },
    "not_found_missing": {
        "en": "These clauses were not detected: {missing}. Ask the insurer specifically about these before buying.",
        "hi": "Ye clauses detect nahi hue: {missing}. Kharidne se pehle insurer se specifically poochein.",
        "mr": "He clauses sapadlle nahi: {missing}. Kharidnyapurvee insurer la specifically vicharaa.",
        "ta": "Intha clause kaL kandupidikkapadavillai: {missing}. Insurer kitta kudrippittu ketungkaL.",
    },
    "generic": {
        "en": "Policy score: {score}/100 ({rating}). High-risk areas: {high}. IRDAI compliance: {comply}. Broker risk: {broker}. Ask me about risks, waiting period, or whether to buy.",
        "hi": "Policy score: {score}/100 ({rating}). High-risk: {high}. IRDAI compliance: {comply}. Broker risk: {broker}.",
        "mr": "Policy score: {score}/100 ({rating}). High-risk: {high}. IRDAI compliance: {comply}. Broker risk: {broker}.",
        "ta": "Policy score: {score}/100 ({rating}). Adhika aapathu: {high}. IRDAI iNakkam: {comply}. Broker aapathu: {broker}.",
    },
    "appeal_strong": {
        "en": "Appeal strength: {label} ({pct}%). {reasoning} — Strong chance of success. File immediately.",
        "hi": "Appeal strength: {label} ({pct}%). {reasoning} — Jeetne ki acchi umeed. Turant file karein.",
        "mr": "Appeal strength: {label} ({pct}%). {reasoning} — Yash milnyachi changle shaktata. Laagalach file kara.",
        "ta": "Appeal valimai: {label} ({pct}%). {reasoning} — Vetri kittum vaaippu nannaa uLLadhu. Udanae file seyyungkaL.",
    },
    "appeal_moderate": {
        "en": "Appeal strength: {label} ({pct}%). {reasoning} — Moderate chance. Strengthen your evidence before filing.",
        "hi": "Appeal strength: {label} ({pct}%). {reasoning} — Moderate chance. File karne se pehle evidence mazboot karein.",
        "mr": "Appeal strength: {label} ({pct}%). {reasoning} — Moderate chance. File karayapurvee evidence mazboot kara.",
        "ta": "Appeal valimai: {label} ({pct}%). {reasoning} — Nadutthara vaaippu. Saatchi valimai seyyungkaL.",
    },
    "appeal_weak": {
        "en": "Appeal strength: {label} ({pct}%). {reasoning} — Low chance currently. Gather more evidence before appealing.",
        "hi": "Appeal strength: {label} ({pct}%). {reasoning} — Abhi kam chance. Aur evidence ikathe karein.",
        "mr": "Appeal strength: {label} ({pct}%). {reasoning} — Kam chance. Jaast evidence gola kara.",
        "ta": "Appeal valimai: {label} ({pct}%). {reasoning} — Ippodhaikku kurai vaaippu. Jaasta saatchi seRuungkaL.",
    },
    "overturn": {
        "en": "To strengthen your case, address these weak points: {weak}. Gather discharge summaries, doctor letters, and payment receipts.",
        "hi": "Case mazboot karne ke liye: {weak}. Discharge summary, doctor letter aur receipts ikathe karein.",
        "mr": "Case mazboot karnyasathi: {weak}. Discharge summary, doctor patra aani receipts gola kara.",
        "ta": "Vazhakkai valimaipaduththa: {weak}. Discharge summary, doctor kaitham, receipts seRuungkaL.",
    },
    "moratorium": {
        "en": "Under IRDAI's 8-year moratorium: after 8 continuous years of coverage, NO claim can be rejected for pre-existing disease — even if undisclosed at purchase.",
        "hi": "IRDAI ke 8-saal moratorium ke anusar: 8 saal baad koi bhi claim pre-existing ke naam par reject nahi ho sakta.",
        "mr": "IRDAI chya 8-varsha moratorium niyamanusaar: 8 varsha nantara pre-existing kaarnane claim nakarau shakat nahi.",
        "ta": "IRDAI in 8-varudham moratorium: 8 aaNdugaL piragu pre-existing noi karanamaaaga claim maRukka mudiyaadhu.",
    },
    "next_steps_dynamic": {
        "en": "Recommended next steps: {steps}",
        "hi": "Agle kadam: {steps}",
        "mr": "Pudhaache kadam: {steps}",
        "ta": "Aduththa padikaL: {steps}",
    },
    "next_steps_generic": {
        "en": "Next steps: 1. File complaint with GRO within 15 days. 2. Escalate to IRDAI IGMS (igms.irda.gov.in). 3. Approach Insurance Ombudsman within 1 year (cioins.co.in). 4. Consumer Court as last resort.",
        "hi": "Agle kadam: 1. 15 din mein GRO complaint. 2. IRDAI IGMS. 3. 1 saal mein Ombudsman. 4. Consumer Court.",
        "mr": "Pudhaache kadam: 1. 15 divsat GRO takraar. 2. IRDAI IGMS. 3. 1 varshaat Ombudsman. 4. Consumer Court.",
        "ta": "Aduththa padikaL: 1. 15 naaLukkuL GRO. 2. IRDAI IGMS. 3. 1 varudhatthil Ombudsman. 4. Consumer Court.",
    },
    "ombudsman": {
        "en": "Insurance Ombudsman: Free, binding for claims up to ₹50 lakhs. File within 1 year of rejection. Find your office at cioins.co.in.",
        "hi": "Insurance Ombudsman: ₹50 lakh tak free aur binding. 1 saal mein file karein. cioins.co.in.",
        "mr": "Insurance Ombudsman: ₹50 lakh paryant free. 1 varshaat file kara. cioins.co.in.",
        "ta": "Insurance Ombudsman: ₹50 latcham varai ilaiyadhu. 1 varudhatthil file seyyungkaL. cioins.co.in.",
    },
    "documents": {
        "en": "Documents needed for appeal: original rejection letter, hospital discharge summary, all bills and receipts, doctor's diagnosis certificate, policy document copy.",
        "hi": "Appeal ke liye documents: original rejection letter, discharge summary, bills, doctor certificate, policy copy.",
        "mr": "Appeal sathi documents: original rejection letter, discharge summary, bills, doctor certificate, policy copy.",
        "ta": "Appeal aavanangkaL: original maRuppu kaitham, discharge summary, bills, doctor certificate, policy nakal.",
    },
    "clause_challengeable": {
        "en": "Rejection reason: {why}. Clause: {clause}. Alignment: {alignment} — this clause may be challengeable. File an appeal with supporting medical evidence.",
        "hi": "Rejection reason: {why}. Clause: {clause}. Alignment: {alignment} — challenge kiya ja sakta hai. Medical evidence ke saath appeal karein.",
        "mr": "Rejection kaaran: {why}. Clause: {clause}. Alignment: {alignment} — challenge karu shaktao. Medical evidence saathe appeal kara.",
        "ta": "Maruthal karanam: {why}. Clause: {clause}. Alignment: {alignment} — savalippikka mudiyum. Medical saatchi udaiya appeal seyyungkaL.",
    },
    "clause_firm": {
        "en": "Rejection reason: {why}. Clause: {clause}. Alignment: {alignment} — insurer's position appears strong. Seek legal opinion before appealing.",
        "hi": "Rejection reason: {why}. Clause: {clause}. Alignment: {alignment} — insurer ki position mazboot. Legal opinion lein.",
        "mr": "Rejection kaaran: {why}. Clause: {clause}. Alignment: {alignment} — insurer chi position mazboot. Legal opinion ghya.",
        "ta": "Maruthal karanam: {why}. Clause: {clause}. Alignment: {alignment} — insurer nillai valimaiyaanadu. Legal katturai vaangungkaL.",
    },
    "audit_generic": {
        "en": "Rejection reason: {why}. Clause: {clause}. Alignment: {alignment}. Appeal: {label} ({pct}%). Strong points: {strong}. Weak points: {weak}.",
        "hi": "Rejection reason: {why}. Clause: {clause}. Alignment: {alignment}. Appeal: {label} ({pct}%). Strong: {strong}. Weak: {weak}.",
        "mr": "Rejection kaaran: {why}. Clause: {clause}. Alignment: {alignment}. Appeal: {label} ({pct}%). Strong: {strong}. Weak: {weak}.",
        "ta": "Maruthal karanam: {why}. Clause: {clause}. Alignment: {alignment}. Appeal: {label} ({pct}%). Valimai: {strong}. Kuraipaadu: {weak}.",
    },
}


def t(key: str, lang: str = "en", **kwargs) -> str:
    entry = _TRANSLATIONS.get(key)
    if entry is None:
        return f"[{key}]"
    template = entry.get(lang) or entry.get("en", f"[{key}]")
    if kwargs:
        try:
            return template.format(**kwargs)
        except KeyError:
            return template
    return template