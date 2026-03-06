# llm/multilingual_translations.py
#
# Pure constants file — NO imports from llm/ or services/
# Provides: t(), SPEECH_LANG_CODES, SYSTEM_LANG_INSTRUCTION

SPEECH_LANG_CODES: dict[str, str] = {
    "en": "en-IN",
    "hi": "hi-IN",
    "mr": "mr-IN",
    "ta": "ta-IN",
}

SYSTEM_LANG_INSTRUCTION: dict[str, str] = {
    "en": "IMPORTANT: You MUST respond ONLY in English. Do not use Hindi, Marathi, or Tamil.",
    "hi": "महत्वपूर्ण: आपको केवल हिंदी में जवाब देना है। अंग्रेजी या किसी अन्य भाषा का उपयोग बिल्कुल न करें। RESPOND ONLY IN HINDI - यह अनिवार्य है।",
    "mr": "महत्त्वाचे: तुम्ही फक्त मराठीत उत्तर द्यायला हवे. इंग्रजी किंवा हिंदी वापरू नका. RESPOND ONLY IN MARATHI - हे अनिवार्य आहे.",
    "ta": "முக்கியம்: நீங்கள் தமிழில் மட்டுமே பதில் சொல்ல வேண்டும். ஆங்கிலம் அல்லது வேறு மொழி பயன்படுத்தாதீர்கள். RESPOND ONLY IN TAMIL - இது கட்டாயம்.",
}

_TRANSLATIONS: dict[str, dict[str, str]] = {

    "risk": {
        "en": "High-risk clauses found: {high}. Policy score: {score}/100 ({rating}). IRDAI compliance: {comply}. Negotiate or avoid these clauses before buying.",
        "hi": "उच्च जोखिम वाले खंड: {high}. पॉलिसी स्कोर: {score}/100 ({rating}). IRDAI अनुपालन: {comply}. खरीदने से पहले इन खंडों पर बातचीत करें।",
        "mr": "उच्च-जोखीम कलम: {high}. पॉलिसी स्कोअर: {score}/100 ({rating}). IRDAI अनुपालन: {comply}. खरेदी करण्यापूर्वी या कलमांवर चर्चा करा.",
        "ta": "அதிக ஆபத்துள்ள விதிகள்: {high}. பாலிசி மதிப்பெண்: {score}/100 ({rating}). IRDAI இணக்கம்: {comply}. வாங்குமுன் இந்த விதிகளை பேசி முடிவு செய்யுங்கள்.",
    },

    "no_high_risk": {
        "en": "No high-risk clauses found. Moderate risks: {mod}. Score: {score}/100 ({rating}). Overall a reasonable policy.",
        "hi": "कोई उच्च जोखिम वाला खंड नहीं मिला। मध्यम जोखिम: {mod}. स्कोर: {score}/100 ({rating}). कुल मिलाकर यह पॉलिसी ठीक है।",
        "mr": "कोणताही उच्च-जोखीम कलम आढळला नाही. मध्यम जोखीम: {mod}. स्कोअर: {score}/100 ({rating}). एकूण ही पॉलिसी ठीक आहे.",
        "ta": "அதிக ஆபத்துள்ள விதிகள் இல்லை. நடுத்தர ஆபத்து: {mod}. மதிப்பெண்: {score}/100 ({rating}). ஒட்டுமொத்தமாக இந்த பாலிசி பரவாயில்லை.",
    },

    "waiting_high": {
        "en": "Waiting period is HIGH RISK — likely 2–4 years for pre-existing diseases. Accidents are covered immediately.",
        "hi": "प्रतीक्षा अवधि उच्च जोखिम — पूर्व-मौजूदा बीमारियों के लिए 2–4 साल। दुर्घटना तुरंत कवर होती है।",
        "mr": "प्रतीक्षा कालावधी उच्च जोखीम — पूर्व-विद्यमान आजारांसाठी 2–4 वर्षे. अपघात त्वरित कव्हर होतो.",
        "ta": "காத்திருப்பு காலம் அதிக ஆபத்து — முன்பிருந்த நோய்களுக்கு 2–4 ஆண்டுகள். விபத்துகள் உடனடியாக கவர் செய்யப்படும்.",
    },

    "waiting_moderate": {
        "en": "Waiting period is MODERATE RISK — typically 1–2 years for specific illnesses. Review the policy document carefully.",
        "hi": "प्रतीक्षा अवधि मध्यम जोखिम — विशिष्ट बीमारियों के लिए 1–2 साल। पॉलिसी दस्तावेज़ ध्यान से पढ़ें।",
        "mr": "प्रतीक्षा कालावधी मध्यम जोखीम — विशिष्ट आजारांसाठी 1–2 वर्षे. पॉलिसी दस्तऐवज काळजीपूर्वक वाचा.",
        "ta": "காத்திருப்பு காலம் நடுத்தர ஆபத்து — குறிப்பிட்ட நோய்களுக்கு 1–2 ஆண்டுகள். பாலிசி ஆவணத்தை கவனமாக படியுங்கள்.",
    },

    "waiting_low": {
        "en": "Waiting period is LOW RISK — standard 30-day initial wait. Pre-existing disease coverage after 1 year.",
        "hi": "प्रतीक्षा अवधि कम जोखिम — सामान्य 30 दिन की प्रारंभिक प्रतीक्षा। पूर्व-मौजूदा बीमारी 1 साल बाद कवर।",
        "mr": "प्रतीक्षा कालावधी कमी जोखीम — सामान्य 30 दिवसांची प्रारंभिक प्रतीक्षा. पूर्व-विद्यमान आजार 1 वर्षानंतर कव्हर.",
        "ta": "காத்திருப்பு காலம் குறைந்த ஆபத்து — வழக்கமான 30 நாள் தொடக்க காத்திருப்பு. முன்பிருந்த நோய் 1 வருடம் பிறகு கவர்.",
    },

    "waiting_not_found": {
        "en": "Waiting period details were not detected. Ask the insurer for the exact schedule before buying.",
        "hi": "प्रतीक्षा अवधि की जानकारी नहीं मिली। खरीदने से पहले बीमाकर्ता से सटीक समय-सारणी पूछें।",
        "mr": "प्रतीक्षा कालावधीची माहिती आढळली नाही. खरेदी करण्यापूर्वी विमाकर्त्याला नेमकी माहिती विचारा.",
        "ta": "காத்திருப்பு கால விவரங்கள் கண்டறியப்படவில்லை. வாங்குமுன் காப்பீட்டாளரிடம் சரியான அட்டவணை கேளுங்கள்.",
    },

    "compliance": {
        "en": "IRDAI compliance rating: {comply}. Broker/structural risk: {broker}. Lower compliance means higher chance of claim disputes.",
        "hi": "IRDAI अनुपालन रेटिंग: {comply}. ब्रोकर जोखिम: {broker}. कम अनुपालन का मतलब दावे में अधिक विवाद।",
        "mr": "IRDAI अनुपालन रेटिंग: {comply}. ब्रोकर जोखीम: {broker}. कमी अनुपालन म्हणजे दाव्यात जास्त वाद.",
        "ta": "IRDAI இணக்க மதிப்பீடு: {comply}. தரகர் ஆபத்து: {broker}. குறைந்த இணக்கம் என்றால் கோரிக்கையில் அதிக சர்ச்சை.",
    },

    "buy_strong": {
        "en": "Score {score}/100 ({rating}) — Strong policy. Broker risk: {broker}. Generally recommended, but always read the fine print.",
        "hi": "स्कोर {score}/100 ({rating}) — मजबूत पॉलिसी. ब्रोकर जोखिम: {broker}. सामान्यतः अनुशंसित, लेकिन बारीक प्रिंट ज़रूर पढ़ें।",
        "mr": "स्कोअर {score}/100 ({rating}) — मजबूत पॉलिसी. ब्रोकर जोखीम: {broker}. सामान्यतः शिफारशीय, पण बारीक अटी नक्की वाचा.",
        "ta": "மதிப்பெண் {score}/100 ({rating}) — வலிமையான பாலிசி. தரகர் ஆபத்து: {broker}. பொதுவாக பரிந்துரைக்கப்படுகிறது, ஆனால் நுண்ணிய அச்சடிப்பை படியுங்கள்.",
    },

    "buy_moderate": {
        "en": "Score {score}/100 ({rating}) — Average policy. Broker risk: {broker}. Negotiate high-risk clauses before signing.",
        "hi": "स्कोर {score}/100 ({rating}) — औसत पॉलिसी. ब्रोकर जोखिम: {broker}. हस्ताक्षर करने से पहले उच्च जोखिम खंडों पर बातचीत करें।",
        "mr": "स्कोअर {score}/100 ({rating}) — सामान्य पॉलिसी. ब्रोकर जोखीम: {broker}. स्वाक्षरी करण्यापूर्वी उच्च जोखीम कलमांवर चर्चा करा.",
        "ta": "மதிப்பெண் {score}/100 ({rating}) — சராசரி பாலிசி. தரகர் ஆபத்து: {broker}. கையெழுத்திடுமுன் அதிக ஆபத்துள்ள விதிகளை பேசுங்கள்.",
    },

    "buy_weak": {
        "en": "Score {score}/100 ({rating}) — Weak policy. Broker risk: {broker}. Not recommended — consider alternatives.",
        "hi": "स्कोर {score}/100 ({rating}) — कमजोर पॉलिसी. ब्रोकर जोखिम: {broker}. अनुशंसित नहीं — विकल्प देखें।",
        "mr": "स्कोअर {score}/100 ({rating}) — कमकुवत पॉलिसी. ब्रोकर जोखीम: {broker}. शिफारशीय नाही — पर्याय शोधा.",
        "ta": "மதிப்பெண் {score}/100 ({rating}) — பலவீனமான பாலிசி. தரகர் ஆபத்து: {broker}. பரிந்துரைக்கப்படவில்லை — மாற்று விருப்பங்களை பாருங்கள்.",
    },

    "negotiate_none": {
        "en": "No high-risk clauses found to negotiate. The policy looks structurally sound.",
        "hi": "बातचीत के लिए कोई उच्च जोखिम खंड नहीं मिला। पॉलिसी संरचनात्मक रूप से ठीक लगती है।",
        "mr": "चर्चेसाठी कोणताही उच्च-जोखीम कलम आढळला नाही. पॉलिसी संरचनात्मकदृष्ट्या ठीक दिसते.",
        "ta": "பேச்சுவார்த்தைக்கு அதிக ஆபத்துள்ள விதிகள் இல்லை. பாலிசி கட்டமைப்பு ரீதியாக சரியாக உள்ளது.",
    },

    "negotiate_high": {
        "en": "Before buying, ask the insurer to clarify or waive: {high}. Get any changes in writing.",
        "hi": "खरीदने से पहले, बीमाकर्ता से स्पष्टीकरण या छूट मांगें: {high}. कोई भी बदलाव लिखित में लें।",
        "mr": "खरेदी करण्यापूर्वी, विमाकर्त्याकडून स्पष्टीकरण किंवा सूट मागा: {high}. कोणताही बदल लेखी स्वरूपात घ्या.",
        "ta": "வாங்குமுன், காப்பீட்டாளரிடம் தெளிவுபடுத்தல் அல்லது விலக்கு கோருங்கள்: {high}. எந்த மாற்றமும் எழுத்தில் வாங்குங்கள்.",
    },

    "all_found": {
        "en": "All standard clauses were detected. No missing sections found.",
        "hi": "सभी मानक खंड पाए गए। कोई गुम अनुभाग नहीं।",
        "mr": "सर्व मानक कलम आढळले. कोणताही गहाळ विभाग नाही.",
        "ta": "அனைத்து நிலையான விதிகளும் கண்டறியப்பட்டன. எந்த பகுதியும் காணவில்லை.",
    },

    "not_found_missing": {
        "en": "These clauses were not detected: {missing}. Ask the insurer specifically about these before buying.",
        "hi": "ये खंड नहीं मिले: {missing}. खरीदने से पहले बीमाकर्ता से विशेष रूप से पूछें।",
        "mr": "हे कलम आढळले नाहीत: {missing}. खरेदी करण्यापूर्वी विमाकर्त्याला विशेषतः विचारा.",
        "ta": "இந்த விதிகள் கண்டறியப்படவில்லை: {missing}. வாங்குமுன் காப்பீட்டாளரிடம் குறிப்பிட்டு கேளுங்கள்.",
    },

    "generic": {
        "en": "Policy score: {score}/100 ({rating}). High-risk areas: {high}. IRDAI compliance: {comply}. Broker risk: {broker}. Ask me about risks, waiting period, compliance, or whether to buy.",
        "hi": "पॉलिसी स्कोर: {score}/100 ({rating}). उच्च जोखिम क्षेत्र: {high}. IRDAI अनुपालन: {comply}. ब्रोकर जोखिम: {broker}. जोखिम, प्रतीक्षा अवधि, या खरीदने के बारे में पूछें।",
        "mr": "पॉलिसी स्कोअर: {score}/100 ({rating}). उच्च-जोखीम क्षेत्र: {high}. IRDAI अनुपालन: {comply}. ब्रोकर जोखीम: {broker}. जोखीम, प्रतीक्षा कालावधी, किंवा खरेदीबद्दल विचारा.",
        "ta": "பாலிசி மதிப்பெண்: {score}/100 ({rating}). அதிக ஆபத்து பகுதிகள்: {high}. IRDAI இணக்கம்: {comply}. தரகர் ஆபத்து: {broker}. ஆபத்துகள், காத்திருப்பு காலம் பற்றி கேளுங்கள்.",
    },

    "appeal_strong": {
        "en": "Appeal strength: {label} ({pct}%). {reasoning} — Strong chance of success. File immediately.",
        "hi": "अपील की ताकत: {label} ({pct}%). {reasoning} — जीतने की अच्छी उम्मीद। तुरंत फाइल करें।",
        "mr": "अपीलची ताकद: {label} ({pct}%). {reasoning} — यश मिळण्याची चांगली शक्यता. लगेच फाइल करा.",
        "ta": "மேல்முறையீட்டு வலிமை: {label} ({pct}%). {reasoning} — வெற்றி வாய்ப்பு நன்றாக உள்ளது. உடனே தாக்கல் செய்யுங்கள்.",
    },

    "appeal_moderate": {
        "en": "Appeal strength: {label} ({pct}%). {reasoning} — Moderate chance. Strengthen your evidence before filing.",
        "hi": "अपील की ताकत: {label} ({pct}%). {reasoning} — मध्यम संभावना। फाइल करने से पहले सबूत मजबूत करें।",
        "mr": "अपीलची ताकद: {label} ({pct}%). {reasoning} — मध्यम शक्यता. फाइल करण्यापूर्वी पुरावे मजबूत करा.",
        "ta": "மேல்முறையீட்டு வலிமை: {label} ({pct}%). {reasoning} — நடுத்தர வாய்ப்பு. தாக்கல் செய்யுமுன் சாட்சிகளை வலுப்படுத்துங்கள்.",
    },

    "appeal_weak": {
        "en": "Appeal strength: {label} ({pct}%). {reasoning} — Low chance currently. Gather more evidence before appealing.",
        "hi": "अपील की ताकत: {label} ({pct}%). {reasoning} — अभी कम संभावना। अपील करने से पहले अधिक सबूत इकट्ठा करें।",
        "mr": "अपीलची ताकद: {label} ({pct}%). {reasoning} — सध्या कमी शक्यता. अपील करण्यापूर्वी अधिक पुरावे गोळा करा.",
        "ta": "மேல்முறையீட்டு வலிமை: {label} ({pct}%). {reasoning} — இப்போது குறைந்த வாய்ப்பு. மேல்முறையீடு செய்யுமுன் அதிக சாட்சிகள் சேருங்கள்.",
    },

    "overturn": {
        "en": "To strengthen your case, address these weak points: {weak}. Gather discharge summaries, doctor letters, and payment receipts.",
        "hi": "अपना मामला मजबूत करने के लिए इन कमज़ोर बिंदुओं को दूर करें: {weak}. डिस्चार्ज सारांश, डॉक्टर पत्र और रसीदें इकट्ठा करें।",
        "mr": "तुमचा दावा मजबूत करण्यासाठी या कमकुवत मुद्द्यांवर लक्ष द्या: {weak}. डिस्चार्ज सारांश, डॉक्टर पत्र आणि पावत्या गोळा करा.",
        "ta": "உங்கள் வழக்கை வலுப்படுத்த இந்த குறைபாடுகளை சரிசெய்யுங்கள்: {weak}. டிஸ்சார்ஜ் சுருக்கம், மருத்துவர் கடிதம், ரசீதுகள் சேருங்கள்.",
    },

    "moratorium": {
        "en": "Under IRDAI's 8-year moratorium: after 8 continuous years of coverage, NO claim can be rejected for pre-existing disease — even if undisclosed at purchase.",
        "hi": "IRDAI के 8 वर्षीय मोरेटोरियम के तहत: 8 साल की लगातार कवरेज के बाद, पूर्व-मौजूदा बीमारी के कारण कोई भी दावा अस्वीकार नहीं किया जा सकता — चाहे खरीदते समय बताया न हो।",
        "mr": "IRDAI च्या 8 वर्षीय मोरेटोरियम अंतर्गत: 8 वर्षांच्या सतत कव्हरेजनंतर, पूर्व-विद्यमान आजाराच्या कारणाने कोणताही दावा नाकारला जाऊ शकत नाही — जरी खरेदी करताना सांगितले नसले तरी.",
        "ta": "IRDAI இன் 8 ஆண்டு தடை விதிப்படி: 8 ஆண்டுகள் தொடர்ந்து கவரேஜுக்குப் பிறகு, முன்பிருந்த நோய் காரணமாக எந்த கோரிக்கையும் நிராகரிக்க முடியாது — வாங்கும்போது சொல்லவில்லை என்றாலும் சரி.",
    },

    "next_steps_dynamic": {
        "en": "Recommended next steps: {steps}",
        "hi": "अनुशंसित अगले कदम: {steps}",
        "mr": "शिफारस केलेले पुढील पावले: {steps}",
        "ta": "பரிந்துரைக்கப்பட்ட அடுத்த படிகள்: {steps}",
    },

    "next_steps_generic": {
        "en": "Next steps: 1. File complaint with insurer's GRO within 15 days. 2. Escalate to IRDAI IGMS (igms.irda.gov.in). 3. Approach Insurance Ombudsman within 1 year (cioins.co.in). 4. Consumer Court as last resort.",
        "hi": "अगले कदम: 1. 15 दिन के भीतर GRO को शिकायत करें. 2. IRDAI IGMS पर जाएं (igms.irda.gov.in). 3. 1 साल में Ombudsman के पास जाएं (cioins.co.in). 4. Consumer Court अंतिम विकल्प।",
        "mr": "पुढील पावले: 1. 15 दिवसांत GRO कडे तक्रार करा. 2. IRDAI IGMS वर जा (igms.irda.gov.in). 3. 1 वर्षात Ombudsman कडे जा (cioins.co.in). 4. Consumer Court शेवटचा पर्याय.",
        "ta": "அடுத்த படிகள்: 1. 15 நாளுக்குள் GRO கிட்ட புகார் செய்யுங்கள். 2. IRDAI IGMS இல் பதிவு செய்யுங்கள் (igms.irda.gov.in). 3. 1 வருடத்தில் Ombudsman அணுகுங்கள் (cioins.co.in). 4. Consumer Court கடைசி வழி.",
    },

    "ombudsman": {
        "en": "Insurance Ombudsman: Free, binding for claims up to ₹50 lakhs. File within 1 year of rejection. Find your office at cioins.co.in.",
        "hi": "बीमा लोकपाल: ₹50 लाख तक के दावों के लिए मुफ़्त और बाध्यकारी. अस्वीकृति के 1 साल के भीतर दाखिल करें. cioins.co.in पर कार्यालय खोजें.",
        "mr": "विमा लोकपाल: ₹50 लाखांपर्यंतच्या दाव्यांसाठी मोफत आणि बंधनकारक. नाकारल्यानंतर 1 वर्षात दाखल करा. cioins.co.in वर कार्यालय शोधा.",
        "ta": "காப்பீடு ஓம்புட்ஸ்மேன்: ₹50 லட்சம் வரை இலவசம் மற்றும் கட்டுப்படுத்தக்கூடியது. நிராகரிப்பிற்கு 1 வருடத்தில் தாக்கல் செய்யுங்கள். cioins.co.in இல் அலுவலகம் கண்டறியுங்கள்.",
    },

    "documents": {
        "en": "Documents needed for appeal: original rejection letter, hospital discharge summary, all bills and receipts, doctor's diagnosis certificate, policy document copy.",
        "hi": "अपील के लिए दस्तावेज़: मूल अस्वीकृति पत्र, अस्पताल डिस्चार्ज सारांश, सभी बिल और रसीदें, डॉक्टर का निदान प्रमाणपत्र, पॉलिसी दस्तावेज़ की प्रति.",
        "mr": "अपीलसाठी कागदपत्रे: मूळ नाकारणे पत्र, रुग्णालय डिस्चार्ज सारांश, सर्व बिले आणि पावत्या, डॉक्टरचे निदान प्रमाणपत्र, पॉलिसी दस्तऐवजाची प्रत.",
        "ta": "மேல்முறையீட்டுக்கு ஆவணங்கள்: அசல் நிராகரிப்பு கடிதம், மருத்துவமனை டிஸ்சார்ஜ் சுருக்கம், அனைத்து பில்கள் மற்றும் ரசீதுகள், மருத்துவரின் நோய் கண்டறிதல் சான்றிதழ், பாலிசி ஆவண நகல்.",
    },

    "clause_challengeable": {
        "en": "Rejection reason: {why}. Clause: {clause}. Alignment: {alignment} — this clause may be challengeable. File an appeal with supporting medical evidence.",
        "hi": "अस्वीकृति का कारण: {why}. खंड: {clause}. संरेखण: {alignment} — यह खंड चुनौती योग्य हो सकता है। चिकित्सा साक्ष्य के साथ अपील करें।",
        "mr": "नाकारण्याचे कारण: {why}. कलम: {clause}. संरेखन: {alignment} — हे कलम आव्हान देण्यायोग्य असू शकते. वैद्यकीय पुराव्यासह अपील करा.",
        "ta": "நிராகரிப்பு காரணம்: {why}. விதி: {clause}. இணைப்பு: {alignment} — இந்த விதியை சவாலிக்க முடியும். மருத்துவ சாட்சியுடன் மேல்முறையீடு செய்யுங்கள்.",
    },

    "clause_firm": {
        "en": "Rejection reason: {why}. Clause: {clause}. Alignment: {alignment} — insurer's position appears strong. Seek legal opinion before appealing.",
        "hi": "अस्वीकृति का कारण: {why}. खंड: {clause}. संरेखण: {alignment} — बीमाकर्ता की स्थिति मजबूत लगती है। अपील करने से पहले कानूनी राय लें।",
        "mr": "नाकारण्याचे कारण: {why}. कलम: {clause}. संरेखन: {alignment} — विमाकर्त्याची स्थिती मजबूत दिसते. अपील करण्यापूर्वी कायदेशीर सल्ला घ्या.",
        "ta": "நிராகரிப்பு காரணம்: {why}. விதி: {clause}. இணைப்பு: {alignment} — காப்பீட்டாளரின் நிலை வலிமையாக தெரிகிறது. மேல்முறையீடு செய்யுமுன் சட்ட ஆலோசனை பெறுங்கள்.",
    },

    "audit_generic": {
        "en": "Rejection reason: {why}. Clause: {clause}. Alignment: {alignment}. Appeal: {label} ({pct}%). Strong points: {strong}. Weak points: {weak}.",
        "hi": "अस्वीकृति का कारण: {why}. खंड: {clause}. संरेखण: {alignment}. अपील: {label} ({pct}%). मजबूत बिंदु: {strong}. कमजोर बिंदु: {weak}.",
        "mr": "नाकारण्याचे कारण: {why}. कलम: {clause}. संरेखन: {alignment}. अपील: {label} ({pct}%). मजबूत मुद्दे: {strong}. कमकुवत मुद्दे: {weak}.",
        "ta": "நிராகரிப்பு காரணம்: {why}. விதி: {clause}. இணைப்பு: {alignment}. மேல்முறையீடு: {label} ({pct}%). வலிமை: {strong}. குறைபாடு: {weak}.",
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