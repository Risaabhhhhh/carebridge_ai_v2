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
    Used for follow-up Q\u0026A after report generation.
    """

    history_text = ""
    for turn in history[-6:]:
        role = turn.get("role", "user").capitalize()
        content_text = turn.get("content", "")
        history_text += f"{role}: {content_text}\n"

    # Build rich report context so model always has something to draw from
    appeal = report_data.get("appeal_strength", {})
    steps  = report_data.get("reapplication_steps", [])
    weak   = report_data.get("weak_points", [])
    strong = report_data.get("strong_points", [])

    return f"""You are an insurance claim advisor helping a policyholder understand their post-rejection audit.
Give a clear, direct, helpful answer of 2-4 sentences. Always draw from the report data provided.
Do not output JSON. Do not say you cannot help. Do not use bullet points — write in plain prose.
If the question is about appeal strength, mention the percentage and reasoning.
If the question is about next steps, give specific actionable advice.

REPORT DATA:
- Rejection reason: {report_data.get("why_rejected", "Not specified")}
- Policy clause: {report_data.get("policy_clause_detected", "Not identified")}
- Clause alignment: {report_data.get("clause_alignment", "Unknown")}
- Appeal strength: {appeal.get("label", "Unknown")} ({appeal.get("percentage", 0)}%)
- Appeal reasoning: {appeal.get("reasoning", "Not available")}
- Can reapply: {report_data.get("reapplication_possible", False)}
- Strong points: {"; ".join(strong) if strong else "None identified"}
- Weak points: {"; ".join(weak) if weak else "None identified"}
- Next steps: {"; ".join(steps[:3]) if steps else "File complaint with GRO, then IRDAI IGMS"}
- Regulatory context: {str(report_data.get("regulatory_considerations", ""))[:300]}
- Confidence: {report_data.get("confidence", "Unknown")}

CONVERSATION HISTORY:
{history_text or "None"}

USER QUESTION: {user_question}

ANSWER (2-4 sentences, plain English, based on the report data above):"""