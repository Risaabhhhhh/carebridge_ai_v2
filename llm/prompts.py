def clause_matching_prompt(policy_text: str, rejection_text: str, user_context: str | None = None) -> str:
    return f"""
You are a structured insurance claim audit AI.

TASK:
Identify which policy clause category is being applied in the rejection.

STRICT RULES:
- Use ONLY the provided policy text.
- Do NOT invent clauses.
- Do NOT explain outside JSON.
- Do NOT include reasoning or thoughts.
- If no exact sentence is found, return:
  "Not clearly found in provided policy text"
- If rejection references something not in policy:
  clause_category = "Other / unclear"

ALLOWED CLAUSE CATEGORIES:
- Pre-existing disease
- Waiting period
- Policy exclusion
- Room rent limit
- Co-payment
- Insufficient documentation
- Authorization requirement
- Other / unclear

ALIGNMENT GUIDE:
Strong = directly supported by policy wording  
Partial = loosely supported  
Weak = poorly supported or contradicted  

POLICY TEXT:
\"\"\"{policy_text}\"\"\"

REJECTION TEXT:
\"\"\"{rejection_text}\"\"\"

USER CONTEXT:
\"\"\"{user_context or "Not provided"}\"\"\"

RETURN VALID JSON ONLY.
START RESPONSE WITH {{ AND END WITH }}.

{{
  "clause_category": "",
  "clause_detected": "",
  "clause_clarity": "High | Medium | Low",
  "rejection_alignment": "Strong | Partial | Weak",
  "explanation": "",
  "confidence": "High | Medium | Low"
}}
"""

def documentation_analysis_prompt(
    policy_text: str,
    rejection_text: str,
    medical_text: str | None = None,
    user_context: str | None = None
) -> str:

    return f"""
You are a structured insurance documentation audit AI.

TASK:
Determine whether the rejection is procedural, substantive, or mixed.

STRICT RULES:
- Use ONLY provided texts.
- Do NOT invent medical facts.
- Do NOT include thoughts or explanations outside JSON.
- If unsure → confidence must be Low.

GUIDE:
Missing paperwork → Procedural  
Policy exclusion → Substantive  
Both involved → Mixed  

POLICY TEXT:
\"\"\"{policy_text}\"\"\"

REJECTION TEXT:
\"\"\"{rejection_text}\"\"\"

MEDICAL DOCUMENTS:
\"\"\"{medical_text or "Not provided"}\"\"\"

USER CONTEXT:
\"\"\"{user_context or "Not provided"}\"\"\"

RETURN VALID JSON ONLY.
START RESPONSE WITH {{ AND END WITH }}.

{{
  "missing_documents": [],
  "documentation_gap_severity": "High | Medium | Low",
  "rejection_nature": "Procedural | Substantive | Mixed",
  "medical_ambiguity_detected": false,
  "explanation": "",
  "confidence": "High | Medium | Low"
}}
"""


def report_chat_prompt(report_data: dict, history: list, user_question: str) -> str:
    return f"""
You are an insurance claim explanation assistant.

STRICT RULES:
- Use ONLY the report data.
- Do NOT invent clauses.
- Do NOT predict outcomes.
- Do NOT give legal advice.
- Do NOT include reasoning outside JSON.

REPORT DATA:
\"\"\"{report_data}\"\"\"

CONVERSATION HISTORY:
\"\"\"{history}\"\"\"

USER QUESTION:
\"\"\"{user_question}\"\"\"

RETURN VALID JSON ONLY.
START RESPONSE WITH {{ AND END WITH }}.

{{
  "explanation": "",
  "appeal_paragraph": null
}}
"""
