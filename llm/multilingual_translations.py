# llm/multilingual_translations.py
#
# ══════════════════════════════════════════════════════════════════════════════
# CareBridge AI — Multilingual Translation Strings
#
# Supported: en (English), hi (Hindi), mr (Marathi), ta (Tamil)
#
# STRATEGY
# ────────
# MedGemma 4B-IT (Gemma 3 base) handles Hindi well, Marathi/Tamil moderately.
# Approach is HYBRID:
#   1. System prompt suffix instructs the model to respond in target language
#   2. All fallback answers use pre-translated template strings here
#   3. IRDAI, IGMS, Ombudsman, GRO stay in English — they are proper nouns
#      the policyholder must recognise when filing complaints
#
# HOW TO ADD A LANGUAGE
# ─────────────────────
# Add the BCP-47 code to SPEECH_LANG_CODES, its name to LANGUAGE_NAMES,
# and a new key to every dict below. The service will pick it up automatically.
# ══════════════════════════════════════════════════════════════════════════════

# Web Speech API BCP-47 codes (used by ReportVoiceChat.tsx)
SPEECH_LANG_CODES: dict[str, str] = {
    "en": "en-IN",
    "hi": "hi-IN",
    "mr": "mr-IN",
    "ta": "ta-IN",
}

# Display names for the language selector UI
LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "hi": "हिन्दी",
    "mr": "मराठी",
    "ta": "தமிழ்",
}

# ── System prompt suffix ──────────────────────────────────────────────────────
# Appended to every report_chat_prompt call.
# Instructs MedGemma to answer in the correct language.
SYSTEM_LANG_INSTRUCTION: dict[str, str] = {
    "en": (
        "Answer in clear, simple English. "
        "Use Indian insurance terms (IRDAI, IGMS, Ombudsman, co-pay, sum insured). "
        "Be concise — 3 to 5 sentences maximum."
    ),
    "hi": (
        "हिन्दी में उत्तर दें — सरल और स्पष्ट भाषा में। "
        "IRDAI, IGMS, Ombudsman जैसे बीमा शब्द अंग्रेज़ी में ही रखें। "
        "उत्तर 3 से 5 वाक्यों में दें।"
    ),
    "mr": (
        "मराठीत उत्तर द्या — सोपी आणि स्पष्ट भाषेत। "
        "IRDAI, IGMS, Ombudsman हे शब्द इंग्रजीत ठेवा. "
        "उत्तर ३ ते ५ वाक्यांत द्या."
    ),
    "ta": (
        "தமிழில் பதிலளிக்கவும் — எளிய மற்றும் தெளிவான மொழியில். "
        "IRDAI, IGMS, Ombudsman போன்ற சொற்களை ஆங்கிலத்திலேயே வைக்கவும். "
        "3 முதல் 5 வாக்கியங்களில் பதிலளிக்கவும்."
    ),
}

# ══════════════════════════════════════════════════════════════════════════════
# PRE-PURCHASE FALLBACK TEMPLATES
# Use t("risk", lang, high=..., score=...) to render.
# ══════════════════════════════════════════════════════════════════════════════
PREPURCHASE_FALLBACK: dict[str, dict[str, str]] = {

    "risk": {
        "en": "The highest-risk clauses are: {high}. These directly reduce your effective coverage at claim time. Overall policy score: {score}/100 ({rating}). IRDAI Compliance: {comply}.",
        "hi": "सबसे अधिक जोखिम वाले खंड हैं: {high}. ये क्लेम के समय आपकी वास्तविक कवरेज कम करते हैं। पॉलिसी स्कोर: {score}/100 ({rating}). IRDAI अनुपालन: {comply}.",
        "mr": "सर्वाधिक धोकादायक खंड: {high}. हे दावा वेळी तुमच्या कव्हरेजला कमी करतात. पॉलिसी स्कोअर: {score}/100 ({rating}). IRDAI अनुपालन: {comply}.",
        "ta": "அதிக ஆபத்துள்ள விதிகள்: {high}. இவை கோரிக்கை நேரத்தில் கவரேஜை குறைக்கின்றன. பாலிசி மதிப்பெண்: {score}/100 ({rating}). IRDAI இணக்கம்: {comply}.",
    },
    "no_high_risk": {
        "en": "No clauses were rated High Risk. Moderate risk areas include: {mod}. Overall score: {score}/100 ({rating}).",
        "hi": "कोई भी खंड High Risk में नहीं। Moderate जोखिम: {mod}. स्कोर: {score}/100 ({rating}).",
        "mr": "कोणताही खंड High Risk मध्ये नाही. Moderate जोखीम: {mod}. स्कोअर: {score}/100 ({rating}).",
        "ta": "எந்த விதியும் High Risk இல் இல்லை. Moderate ஆபத்து: {mod}. மதிப்பெண்: {score}/100 ({rating}).",
    },
    "waiting_high": {
        "en": "This policy has a long waiting period (3+ years). You cannot claim for pre-existing conditions during this time.",
        "hi": "इस पॉलिसी में लंबी प्रतीक्षा अवधि (3+ वर्ष) है। इस दौरान पहले से मौजूद बीमारियों के लिए क्लेम नहीं कर सकते।",
        "mr": "या पॉलिसीत दीर्घ प्रतीक्षा कालावधी (3+ वर्षे) आहे. या काळात पूर्व-आजारांसाठी दावा करता येणार नाही.",
        "ta": "இந்த பாலிசியில் நீண்ட காத்திருப்பு காலம் (3+ ஆண்டுகள்) உள்ளது. இந்த காலத்தில் முன் இருந்த நோய்களுக்கு கோரிக்கை தாக்கல் செய்ய முடியாது.",
    },
    "waiting_moderate": {
        "en": "The waiting period is Moderate Risk (1–3 years). Confirm the exact duration before signing.",
        "hi": "प्रतीक्षा अवधि Moderate Risk (1–3 वर्ष) है। साइन करने से पहले सटीक अवधि की पुष्टि करें।",
        "mr": "प्रतीक्षा कालावधी Moderate Risk (1–3 वर्षे) आहे. सही करण्यापूर्वी अचूक कालावधी तपासा.",
        "ta": "காத்திருப்பு காலம் Moderate Risk (1–3 ஆண்டுகள்). கையெழுத்திடுவதற்கு முன் சரியான காலத்தை உறுதிப்படுத்தவும்.",
    },
    "waiting_low": {
        "en": "The waiting period appears short — a positive indicator. Verify the exact clause.",
        "hi": "प्रतीक्षा अवधि कम लगती है — यह अच्छा संकेत है। सटीक खंड जाँचें।",
        "mr": "प्रतीक्षा कालावधी कमी दिसतो — हे चांगले लक्षण आहे. अचूक खंड तपासा.",
        "ta": "காத்திருப்பு காலம் குறைவாக உள்ளது — நல்ல அறிகுறி. சரியான விதியை சரிபார்க்கவும்.",
    },
    "waiting_not_found": {
        "en": "Waiting period was not detectable. Ask the insurer: how many months until pre-existing conditions are covered?",
        "hi": "प्रतीक्षा अवधि पता नहीं चली। बीमाकर्ता से पूछें: पहले से मौजूद बीमारियाँ कितने महीनों बाद कवर होंगी?",
        "mr": "प्रतीक्षा कालावधी आढळला नाही. विमाकर्त्याला विचारा: पूर्व-आजार किती महिन्यांनंतर कव्हर होतात?",
        "ta": "காத்திருப்பு காலம் கண்டறியவில்லை. காப்பீட்டாளரிடம் கேளுங்கள்: முன் இருந்த நோய்கள் எத்தனை மாதங்களுக்கு பிறகு கவர் ஆகும்?",
    },
    "compliance": {
        "en": "IRDAI compliance is rated {comply}. This covers: free-look period, grievance redressal, and claim timelines. Structural risk: {broker}.",
        "hi": "IRDAI अनुपालन: {comply}. इसमें शामिल है: free-look period, शिकायत निवारण, दावा समयसीमा। संरचनात्मक जोखिम: {broker}.",
        "mr": "IRDAI अनुपालन: {comply}. यात समाविष्ट: free-look period, तक्रार निवारण, दावा वेळमर्यादा. संरचनात्मक धोका: {broker}.",
        "ta": "IRDAI இணக்கம்: {comply}. இதில் உள்ளது: free-look period, புகார் தீர்வு, கோரிக்கை காலக்கெடு. கட்டமைப்பு ஆபத்து: {broker}.",
    },
    "buy_strong": {
        "en": "Policy Score: {score}/100 ({rating}). This policy scores well and appears consumer-friendly. Structural Risk: {broker}.",
        "hi": "पॉलिसी स्कोर: {score}/100 ({rating}). यह पॉलिसी अच्छी है और उपभोक्ता-अनुकूल लगती है। संरचनात्मक जोखिम: {broker}.",
        "mr": "पॉलिसी स्कोअर: {score}/100 ({rating}). ही पॉलिसी चांगली आणि ग्राहक-अनुकूल दिसते. संरचनात्मक धोका: {broker}.",
        "ta": "பாலிசி மதிப்பெண்: {score}/100 ({rating}). இந்த பாலிசி நல்ல மதிப்பெண் பெறுகிறது மற்றும் நுகர்வோர் நட்பு. கட்டமைப்பு ஆபத்து: {broker}.",
    },
    "buy_moderate": {
        "en": "Policy Score: {score}/100 ({rating}). Moderate score. Clarify the High Risk clauses before signing. Structural Risk: {broker}.",
        "hi": "पॉलिसी स्कोर: {score}/100 ({rating}). मध्यम स्कोर। साइन से पहले High Risk खंड स्पष्ट करें। संरचनात्मक जोखिम: {broker}.",
        "mr": "पॉलिसी स्कोअर: {score}/100 ({rating}). मध्यम स्कोअर. सही करण्यापूर्वी High Risk खंड स्पष्ट करा. संरचनात्मक धोका: {broker}.",
        "ta": "பாலிசி மதிப்பெண்: {score}/100 ({rating}). நடுத்தர மதிப்பெண். கையெழுத்திடுவதற்கு முன் High Risk விதிகளை தெளிவுபடுத்துங்கள். கட்டமைப்பு ஆபத்து: {broker}.",
    },
    "buy_weak": {
        "en": "Policy Score: {score}/100 ({rating}). Low score. Compare alternatives or negotiate clause amendments. Structural Risk: {broker}.",
        "hi": "पॉलिसी स्कोर: {score}/100 ({rating}). कम स्कोर। विकल्पों से तुलना करें या खंड संशोधन पर बातचीत करें। संरचनात्मक जोखिम: {broker}.",
        "mr": "पॉलिसी स्कोअर: {score}/100 ({rating}). कमी स्कोअर. पर्यायांशी तुलना करा किंवा खंड सुधारणेची वाटाघाटी करा. संरचनात्मक धोका: {broker}.",
        "ta": "பாலிசி மதிப்பெண்: {score}/100 ({rating}). குறைந்த மதிப்பெண். மாற்று வழிகளை ஒப்பிடுங்கள் அல்லது விதி திருத்தங்களை பேசுங்கள். கட்டமைப்பு ஆபத்து: {broker}.",
    },
    "negotiate_high": {
        "en": "Before buying, get written clarification on: {high}. Also ask for the insurer's claim settlement ratio and exact waiting period.",
        "hi": "खरीदने से पहले लिखित स्पष्टीकरण लें: {high}. बीमाकर्ता का claim settlement ratio और प्रतीक्षा अवधि भी पूछें।",
        "mr": "खरेदी करण्यापूर्वी लेखी स्पष्टीकरण घ्या: {high}. विमाकर्त्याचे claim settlement ratio आणि प्रतीक्षा कालावधी विचारा.",
        "ta": "வாங்குவதற்கு முன் எழுத்துப்பூர்வ விளக்கம் பெறுங்கள்: {high}. காப்பீட்டாளரின் claim settlement ratio மற்றும் காத்திருப்பு காலத்தையும் கேளுங்கள்.",
    },
    "negotiate_none": {
        "en": "No High Risk clauses detected. Still ask the insurer to clarify exclusions and confirm there are no hidden sub-limits.",
        "hi": "कोई High Risk खंड नहीं मिला। फिर भी exclusions स्पष्ट करवाएँ और छुपे sub-limits की पुष्टि करें।",
        "mr": "High Risk खंड आढळले नाहीत. तरीही exclusions स्पष्ट करण्यास सांगा आणि लपलेल्या sub-limits नाहीत याची खात्री करा.",
        "ta": "High Risk விதிகள் இல்லை. இருந்தாலும் விலக்குகளை தெளிவுபடுத்தும்படி கேளுங்கள் மற்றும் மறைக்கப்பட்ட sub-limits இல்லை என்பதை உறுதிப்படுத்துங்கள்.",
    },
    "not_found_missing": {
        "en": "These clauses were not detectable: {missing}. Upload the full policy document or ask the insurer directly.",
        "hi": "ये खंड पता नहीं चले: {missing}. पूरी पॉलिसी अपलोड करें या बीमाकर्ता से सीधे पूछें।",
        "mr": "हे खंड आढळले नाहीत: {missing}. पूर्ण पॉलिसी अपलोड करा किंवा विमाकर्त्याला थेट विचारा.",
        "ta": "இந்த விதிகள் கண்டறியப்படவில்லை: {missing}. முழு பாலிசியை பதிவேற்றுங்கள் அல்லது காப்பீட்டாளரிடம் நேரடியாக கேளுங்கள்.",
    },
    "all_found": {
        "en": "All 10 clauses were detected in the policy text.",
        "hi": "पॉलिसी टेक्स्ट में सभी 10 खंड पाए गए।",
        "mr": "पॉलिसी मजकुरात सर्व 10 खंड आढळले.",
        "ta": "பாலிசி உரையில் அனைத்து 10 விதிகளும் கண்டறியப்பட்டன.",
    },
    "generic": {
        "en": "Policy Score: {score}/100 ({rating}). High Risk clauses: {high}. IRDAI Compliance: {comply}. Structural Risk: {broker}.",
        "hi": "पॉलिसी स्कोर: {score}/100 ({rating}). High Risk खंड: {high}. IRDAI: {comply}. संरचनात्मक जोखिम: {broker}.",
        "mr": "पॉलिसी स्कोअर: {score}/100 ({rating}). High Risk खंड: {high}. IRDAI: {comply}. संरचनात्मक धोका: {broker}.",
        "ta": "பாலிசி மதிப்பெண்: {score}/100 ({rating}). High Risk விதிகள்: {high}. IRDAI: {comply}. கட்டமைப்பு ஆபத்து: {broker}.",
    },
}

# ══════════════════════════════════════════════════════════════════════════════
# AUDIT / CLAIM REJECTION FALLBACK TEMPLATES
# ══════════════════════════════════════════════════════════════════════════════
AUDIT_FALLBACK: dict[str, dict[str, str]] = {

    "appeal_strong": {
        "en": "Appeal rated {label} at {pct}%. {reasoning} Strong position — challenge formally.",
        "hi": "अपील {label} ({pct}%) रेट की गई। {reasoning} मज़बूत स्थिति — औपचारिक रूप से चुनौती दें।",
        "mr": "अपील {label} ({pct}%) रेट केली. {reasoning} मजबूत स्थिती — औपचारिकपणे आव्हान द्या.",
        "ta": "மேல்முறையீடு {label} ({pct}%) மதிப்பிடப்பட்டது. {reasoning} வலுவான நிலை — முறையாக சவால் விடுங்கள்.",
    },
    "appeal_moderate": {
        "en": "Appeal rated {label} at {pct}%. {reasoning} Worth pursuing — address the evidence gaps first.",
        "hi": "अपील {label} ({pct}%)। {reasoning} प्रयास करें — पहले साक्ष्य अंतराल दूर करें।",
        "mr": "अपील {label} ({pct}%). {reasoning} प्रयत्न करा — आधी पुरावा अंतर दूर करा.",
        "ta": "மேல்முறையீடு {label} ({pct}%). {reasoning} முயற்சிக்க மதிப்புள்ளது — முதலில் சாட்சி இடைவெளிகளை நிரப்புங்கள்.",
    },
    "appeal_weak": {
        "en": "Appeal rated {label} at {pct}%. {reasoning} Difficult case — invoke the IRDAI moratorium if policy is 8+ years old.",
        "hi": "अपील {label} ({pct}%)। {reasoning} कठिन मामला — पॉलिसी 8+ वर्ष पुरानी हो तो IRDAI moratorium लागू करें।",
        "mr": "अपील {label} ({pct}%). {reasoning} कठीण प्रकरण — पॉलिसी 8+ वर्षे जुनी असेल तर IRDAI moratorium लागू करा.",
        "ta": "மேல்முறையீடு {label} ({pct}%). {reasoning} கடினமான வழக்கு — பாலிசி 8+ ஆண்டுகள் பழையது என்றால் IRDAI moratorium ஐ பயன்படுத்துங்கள்.",
    },
    "overturn": {
        "en": "To overturn: address {weak}. Get a physician's letter confirming the exact diagnosis date, cross-reference the rejection clause against IRDAI's standardised exclusion definitions. If the policy is 8+ years old, invoke the IRDAI moratorium — pre-existing exclusions cannot apply.",
        "hi": "पलटने के लिए: {weak} संबोधित करें। सटीक निदान तारीख का डॉक्टरी पत्र लें, IRDAI के मानकीकृत exclusion परिभाषाओं से rejection clause की जाँच करें। पॉलिसी 8+ वर्ष पुरानी हो तो IRDAI moratorium लागू करें।",
        "mr": "उलट करण्यासाठी: {weak} संबोधित करा. अचूक निदान तारखेचे डॉक्टरांचे पत्र मिळवा, IRDAI च्या मानकीकृत exclusion व्याख्यांशी rejection clause ची तुलना करा. पॉलिसी 8+ वर्षे जुनी असेल तर IRDAI moratorium लागू करा.",
        "ta": "திருப்பிவிட: {weak} ஐ நிவர்த்தி செய்யுங்கள். சரியான நோயறிதல் தேதியை உறுதிப்படுத்தும் மருத்துவரின் கடிதம் பெறுங்கள், IRDAI இன் தரப்படுத்தப்பட்ட விலக்கு வரையறைகளுடன் நிராகரிப்பு விதியை ஒப்பிடுங்கள். பாலிசி 8+ ஆண்டுகள் பழையது என்றால் IRDAI moratorium ஐ பயன்படுத்துங்கள்.",
    },
    "moratorium": {
        "en": "The IRDAI 8-year moratorium: after 8 continuous years on any health policy, the insurer cannot reject citing pre-existing disease — even if not disclosed at inception. If your policy is 8+ years old, this is your strongest legal argument.",
        "hi": "IRDAI 8-वर्ष moratorium: किसी भी स्वास्थ्य पॉलिसी पर लगातार 8 वर्षों के बाद, बीमाकर्ता पहले से मौजूद बीमारी का हवाला देकर अस्वीकार नहीं कर सकता। यदि पॉलिसी 8+ वर्ष पुरानी है, यही सबसे मज़बूत कानूनी तर्क है।",
        "mr": "IRDAI 8-वर्ष moratorium: 8 वर्षांच्या सतत पॉलिसीनंतर, विमाकर्ता पूर्व-आजाराचा हवाला देऊन नाकारू शकत नाही. पॉलिसी 8+ वर्षे जुनी असल्यास हा सर्वात मजबूत कायदेशीर युक्तिवाद आहे.",
        "ta": "IRDAI 8-ஆண்டு moratorium: எந்த சுகாதார பாலிசியிலும் 8 ஆண்டுகளுக்கு பிறகு, காப்பீட்டாளர் முன் இருந்த நோயை மேற்கோள் காட்டி நிராகரிக்க முடியாது. பாலிசி 8+ ஆண்டுகள் பழையது என்றால் இது உங்கள் வலுவான சட்ட வாதம்.",
    },
    "next_steps_dynamic": {
        "en": "{steps} File with IRDAI IGMS if no response in 15 days. Approach Ombudsman within 1 year.",
        "hi": "{steps} 15 दिनों में जवाब न मिले तो IRDAI IGMS में दर्ज करें। 1 वर्ष के भीतर Ombudsman से संपर्क करें।",
        "mr": "{steps} 15 दिवसांत प्रतिसाद नसल्यास IRDAI IGMS मध्ये दाखल करा. 1 वर्षाच्या आत Ombudsman कडे जा.",
        "ta": "{steps} 15 நாட்களில் பதில் இல்லை என்றால் IRDAI IGMS இல் தாக்கல் செய்யுங்கள். 1 ஆண்டிற்குள் Ombudsman ஐ அணுகுங்கள்.",
    },
    "next_steps_generic": {
        "en": "1. File written complaint with insurer GRO. 2. Escalate to IRDAI IGMS (igms.irda.gov.in) if no response in 15 days. 3. Approach Insurance Ombudsman (cioins.co.in) within 1 year of final reply.",
        "hi": "1. बीमाकर्ता के GRO को लिखित शिकायत दर्ज करें। 2. 15 दिनों में जवाब न मिले तो IRDAI IGMS पर जाएँ। 3. अंतिम जवाब के 1 वर्ष के भीतर Insurance Ombudsman से संपर्क करें।",
        "mr": "1. विमाकर्त्याच्या GRO कडे लेखी तक्रार दाखल करा. 2. 15 दिवसांत प्रतिसाद नसल्यास IRDAI IGMS वर जा. 3. अंतिम उत्तराच्या 1 वर्षाच्या आत Insurance Ombudsman कडे जा.",
        "ta": "1. காப்பீட்டாளரின் GRO க்கு எழுத்துப்பூர்வ புகார் தாக்கல். 2. 15 நாட்களில் பதில் இல்லை என்றால் IRDAI IGMS க்கு அனுப்புங்கள். 3. இறுதி பதிலின் 1 ஆண்டிற்குள் Insurance Ombudsman ஐ அணுகுங்கள்.",
    },
    "ombudsman": {
        "en": "File with IRDAI IGMS first. If unresolved in 30 days, approach the Insurance Ombudsman. Eligibility: claims up to ₹50 lakhs, within 1 year of insurer's final reply. Free and binding.",
        "hi": "पहले IRDAI IGMS में दर्ज करें। 30 दिनों में हल न हो तो Insurance Ombudsman जाएँ। पात्रता: ₹50 लाख तक, अंतिम जवाब के 1 वर्ष के भीतर। निशुल्क और बाध्यकारी।",
        "mr": "प्रथम IRDAI IGMS मध्ये दाखल करा. 30 दिवसांत निराकरण न झाल्यास Insurance Ombudsman कडे जा. पात्रता: ₹50 लाख पर्यंत, 1 वर्षाच्या आत. मोफत आणि बंधनकारक.",
        "ta": "முதலில் IRDAI IGMS இல் தாக்கல் செய்யுங்கள். 30 நாட்களில் தீர்க்கப்படவில்லை என்றால் Insurance Ombudsman ஐ அணுகுங்கள். தகுதி: ₹50 லட்சம் வரை, 1 ஆண்டிற்குள். இலவசம் மற்றும் கட்டுப்படுத்தும்.",
    },
    "documents": {
        "en": "For appeal: (1) full policy document, (2) original rejection letter, (3) all medical records, (4) hospital discharge summary and bills, (5) doctor's certificate with exact diagnosis date, (6) prior correspondence with insurer.",
        "hi": "अपील के लिए: (1) पूर्ण पॉलिसी, (2) rejection letter, (3) सभी चिकित्सा रिकॉर्ड, (4) discharge summary और बिल, (5) निदान तारीख का डॉक्टरी प्रमाण, (6) बीमाकर्ता से पत्राचार।",
        "mr": "अपीलसाठी: (1) पूर्ण पॉलिसी, (2) rejection letter, (3) सर्व वैद्यकीय नोंदी, (4) discharge summary आणि बिले, (5) निदान तारखेचे डॉक्टरांचे प्रमाणपत्र, (6) विमाकर्त्याशी पत्रव्यवहार.",
        "ta": "மேல்முறையீட்டிற்கு: (1) முழு பாலிசி, (2) நிராகரிப்பு கடிதம், (3) அனைத்து மருத்துவ பதிவுகள், (4) வெளியேற்ற சுருக்கம் மற்றும் பில்கள், (5) நோயறிதல் தேதியுடன் மருத்துவரின் சான்றிதழ், (6) காப்பீட்டாளருடன் கடிதப் போக்குவரத்து.",
    },
    "clause_challengeable": {
        "en": 'Clause applied: "{clause}". Rejection basis: "{why}". Alignment: {alignment}. Potentially challengeable — the insurer application appears weak.',
        "hi": 'लागू खंड: "{clause}". Rejection का आधार: "{why}". Alignment: {alignment}. संभावित रूप से चुनौती देने योग्य।',
        "mr": 'लागू खंड: "{clause}". Rejection चा आधार: "{why}". Alignment: {alignment}. संभाव्यतः आव्हानयोग्य.',
        "ta": 'பயன்படுத்திய விதி: "{clause}". நிராகரிப்பு அடிப்படை: "{why}". Alignment: {alignment}. சாத்தியமான சவாலளிக்கக்கூடியது.',
    },
    "clause_firm": {
        "en": 'Clause applied: "{clause}". Rejection basis: "{why}". Alignment: {alignment}. The insurer has a policy basis, but you can still contest the interpretation.',
        "hi": 'लागू खंड: "{clause}". Rejection का आधार: "{why}". Alignment: {alignment}. बीमाकर्ता के पास आधार है, लेकिन व्याख्या को चुनौती दी जा सकती है।',
        "mr": 'लागू खंड: "{clause}". Rejection चा आधार: "{why}". Alignment: {alignment}. विमाकर्त्याकडे आधार आहे, पण व्याख्येला आव्हान देता येते.',
        "ta": 'பயன்படுத்திய விதி: "{clause}". நிராகரிப்பு அடிப்படை: "{why}". Alignment: {alignment}. காப்பீட்டாளரிடம் அடிப்படை உள்ளது, ஆனால் விளக்கத்தை மறுக்கலாம்.',
    },
    "generic": {
        "en": 'Rejection: "{why}". Clause: "{clause}" ({alignment}). Appeal: {label} ({pct}%). Strong: {strong}. Challenges: {weak}.',
        "hi": 'Rejection: "{why}". खंड: "{clause}" ({alignment}). अपील: {label} ({pct}%). मज़बूत: {strong}. चुनौतियाँ: {weak}.',
        "mr": 'Rejection: "{why}". खंड: "{clause}" ({alignment}). अपील: {label} ({pct}%). मजबूत: {strong}. आव्हाने: {weak}.',
        "ta": 'நிராகரிப்பு: "{why}". விதி: "{clause}" ({alignment}). மேல்முறையீடு: {label} ({pct}%). வலுவான: {strong}. சவால்கள்: {weak}.',
    },
}

# ── UI strings (consumed by ReportVoiceChat.tsx via /api/ui-strings or hardcoded) ──
UI_STRINGS: dict[str, dict[str, str]] = {
    "placeholder": {
        "en": "Ask about your report…",
        "hi": "अपनी रिपोर्ट के बारे में पूछें…",
        "mr": "तुमच्या रिपोर्टबद्दल विचारा…",
        "ta": "உங்கள் அறிக்கையைப் பற்றி கேளுங்கள்…",
    },
    "listening": {
        "en": "Listening…",
        "hi": "सुन रहा है…",
        "mr": "ऐकत आहे…",
        "ta": "கேட்கிறேன்…",
    },
    "thinking": {
        "en": "Thinking…",
        "hi": "सोच रहा है…",
        "mr": "विचार करत आहे…",
        "ta": "யோசிக்கிறேன்…",
    },
    "chat_title": {
        "en": "Ask About This Report",
        "hi": "इस रिपोर्ट के बारे में पूछें",
        "mr": "या रिपोर्टबद्दल विचारा",
        "ta": "இந்த அறிக்கையைப் பற்றி கேளுங்கள்",
    },
    "sources_label": {
        "en": "Regulatory Sources",
        "hi": "नियामक स्रोत",
        "mr": "नियामक स्रोत",
        "ta": "ஒழுங்குமுறை ஆதாரங்கள்",
    },
    "send": {
        "en": "Send",
        "hi": "भेजें",
        "mr": "पाठवा",
        "ta": "அனுப்பு",
    },
    "voice_on":  {"en": "Voice on",  "hi": "आवाज़ चालू", "mr": "आवाज चालू", "ta": "குரல் ஆன்"},
    "voice_off": {"en": "Voice off", "hi": "आवाज़ बंद",  "mr": "आवाज बंद",  "ta": "குரல் ஆஃப்"},
}


def t(key: str, lang: str = "en", **kwargs) -> str:
    """
    Translate a key into the target language with optional format substitution.

    Usage:
        t("risk",          "hi", high="co_payment", score=72, rating="Moderate", comply="Good")
        t("next_steps_generic", "ta")
        t("listening",     "mr")   # UI string

    Falls back to English if lang is not found for the key.
    """
    lang = lang if lang in SPEECH_LANG_CODES else "en"

    template: str = (
        PREPURCHASE_FALLBACK.get(key, {}).get(lang)
        or AUDIT_FALLBACK.get(key, {}).get(lang)
        or UI_STRINGS.get(key, {}).get(lang)
        or PREPURCHASE_FALLBACK.get(key, {}).get("en")
        or AUDIT_FALLBACK.get(key, {}).get("en")
        or UI_STRINGS.get(key, {}).get("en")
        or key
    )

    try:
        return template.format(**kwargs) if kwargs else template
    except KeyError:
        return template