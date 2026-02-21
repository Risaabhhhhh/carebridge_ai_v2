# llm/prompts.py


def clause_matching_prompt(
    policy_text: str,
    rejection_text: str,
    user_context: str | None = None,
) -> str:

    return f"""You are a structured insurance claim audit AI specialising in Indian health insurance policies.

TASK: Identify which policy clause category is being applied in the claim rejection.

ALLOWED CLAUSE CATEGORIES (use exactly as written):
- "Pre-existing disease"
- "Waiting period"
- "Policy exclusion"
- "Room rent limit"
- "Co-payment"
- "Insufficient documentation"
- "Authorization requirement"
- "Not Detected"
- "Other / unclear"

ALIGNMENT GUIDE:
- "Strong"       = rejection directly supported by a specific policy clause
- "Partial"      = loosely or indirectly supported
- "Weak"         = poorly supported or contradicted by policy text
- "Not Detected" = no identifiable clause found

CONFIDENCE GUIDE:
- "High"   = clear match, unambiguous
- "Medium" = reasonable match with some uncertainty
- "Low"    = uncertain, insufficient information

STRICT RULES:
- Use ONLY the provided policy and rejection text.
- Do NOT invent clauses or facts.
- For clause_detected: quote the most relevant sentence from policy text, or write "Not found in policy text".
- Output ONLY the JSON object. No text before or after.

EXAMPLE OUTPUT:
{{
  "clause_category": "Waiting period",
  "clause_detected": "Claims for any illness within the first 30 days of policy inception shall not be admissible.",
  "clause_clarity": "High",
  "rejection_alignment": "Strong",
  "explanation": "The rejection cites a 30-day waiting period. Policy clearly states claims within first 30 days are inadmissible.",
  "confidence": "High"
}}

POLICY TEXT:
{policy_text}

REJECTION TEXT:
{rejection_text}

USER CONTEXT:
{user_context or "Not provided"}

JSON OUTPUT:"""


def documentation_analysis_prompt(
    policy_text: str,
    rejection_text: str,
    medical_text: str | None = None,
    user_context: str | None = None,
) -> str:

    return f"""You are a structured insurance documentation audit AI specialising in Indian health insurance claims.

TASK: Analyse whether the claim rejection is procedural, substantive, or mixed based on the provided documents.

DEFINITIONS:
- "Procedural"    = rejection due to missing paperwork, incomplete forms, or process errors (fixable by resubmission)
- "Substantive"   = rejection due to policy exclusion, clause limitation, or non-coverage (requires appeal or clause challenge)
- "Mixed"         = both procedural and substantive elements present
- "Not Detected"  = cannot determine from provided text

SEVERITY GUIDE (documentation_gap_severity):
- "High"   = critical documents missing or completely absent
- "Medium" = some documents incomplete or partially missing
- "Low"    = documentation appears adequate

STRICT RULES:
- Use ONLY the provided texts. Do NOT invent medical facts.
- missing_documents: list specific document names that are absent or incomplete. Empty list if none.
- medical_ambiguity_detected: true only if medical records contain vague, contradictory, or unclear diagnosis language.
- Output ONLY the JSON object. No text before or after.

EXAMPLE OUTPUT:
{{
  "missing_documents": ["Discharge summary", "Doctor's certificate"],
  "documentation_gap_severity": "High",
  "rejection_nature": "Procedural",
  "medical_ambiguity_detected": false,
  "explanation": "Rejection cites missing discharge summary and doctor's certificate. No substantive policy clause cited.",
  "confidence": "High"
}}

POLICY TEXT:
{policy_text}

REJECTION TEXT:
{rejection_text}

MEDICAL DOCUMENTS:
{medical_text or "Not provided"}

USER CONTEXT:
{user_context or "Not provided"}

JSON OUTPUT:"""


def report_chat_prompt(
    report_data: dict,
    history: list,
    user_question: str,
) -> str:
    """
    Natural language chat prompt — returns plain text explanation, not JSON.
    Used for follow-up Q&A after report generation.
    """

    # Format history as readable turns
    history_text = ""
    for turn in history[-6:]:   # last 3 exchanges to stay within context
        role = turn.get("role", "user").capitalize()
        content = turn.get("content", "")
        history_text += f"{role}: {content}\n"

    return f"""You are a helpful insurance claim advisor explaining a post-rejection audit report to a policyholder.

STRICT RULES:
- Use ONLY the information in the report data below.
- Do NOT invent policy clauses, legal outcomes, or medical facts.
- Do NOT predict whether the appeal will succeed.
- Do NOT give legal advice.
- Speak clearly and simply — the user may not be familiar with insurance terminology.
- If the question cannot be answered from the report, say so honestly.
- Respond in plain conversational English. Do NOT output JSON.

REPORT SUMMARY:
- Rejection reason: {report_data.get("why_rejected", "Not available")}
- Clause detected: {report_data.get("policy_clause_detected", "Not available")}
- Clause alignment: {report_data.get("clause_alignment", "Not available")}
- Appeal strength: {report_data.get("appeal_strength", {}).get("label", "Not available")} ({report_data.get("appeal_strength", {}).get("percentage", "N/A")}%)
- Confidence: {report_data.get("confidence", "Not available")}
- Key weak points: {"; ".join(report_data.get("weak_points", [])) or "None"}
- Key strong points: {"; ".join(report_data.get("strong_points", [])) or "None"}

CONVERSATION HISTORY:
{history_text or "No previous conversation."}

USER QUESTION:
{user_question}

YOUR RESPONSE:"""