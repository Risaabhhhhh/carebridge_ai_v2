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
    Conversational prompt for post-rejection AND pre-purchase report chat.
    
    Key improvements vs original:
    - Full report data unpacked (not just 6 fields)
    - Conversation history formatted as proper turns the model understands
    - Context-aware — detects prepurchase vs audit from report structure
    - Explicit anti-hallucination instruction
    - Longer answer allowed (3-5 sentences) for complex questions
    - Regulatory guidance included in context
    - Pre-purchase specific data included when present
    """

    # ── Detect context from report structure ──────────────────
    is_prepurchase = "clause_risk" in report_data and "appeal_strength" not in report_data
    is_audit       = "appeal_strength" in report_data

    # ── Format conversation history properly ──────────────────
    history_lines = []
    for turn in history[-(12):]   :   # last 6 turns = 12 messages
        role    = turn.get("role", "user")
        content = str(turn.get("content", "")).strip()
        if not content:
            continue
        if role == "user":
            history_lines.append(f"User: {content}")
        else:
            history_lines.append(f"Assistant: {content}")
    history_text = "\n".join(history_lines) if history_lines else "No prior conversation."

    # ── Build context block ───────────────────────────────────
    if is_prepurchase:
        clause_risk   = report_data.get("clause_risk", {})
        score         = report_data.get("score_breakdown", {})
        irdai         = report_data.get("irdai_compliance", {})
        broker        = report_data.get("broker_risk_analysis", {})
        red_flags     = report_data.get("red_flags", [])
        pos_flags     = report_data.get("positive_flags", [])
        checklist     = report_data.get("checklist_for_buyer", [])

        # Identify worst clauses for the model to reference
        high_risk     = [k for k, v in (clause_risk or {}).items() if v == "High Risk"]
        moderate_risk = [k for k, v in (clause_risk or {}).items() if v == "Moderate Risk"]

        context_block = f"""REPORT TYPE: Pre-Purchase Policy Analysis

POLICY SCORE: {score.get('adjusted_score', 'N/A')}/100 — Rating: {score.get('rating', 'N/A')} — Risk Index: {score.get('risk_index', 'N/A')}

CLAUSE RISK ASSESSMENT (10 clauses):
{chr(10).join(f'  - {k}: {v}' for k, v in (clause_risk or {}).items())}

HIGH RISK CLAUSES: {', '.join(high_risk) if high_risk else 'None detected'}
MODERATE RISK CLAUSES: {', '.join(moderate_risk) if moderate_risk else 'None'}

IRDAI COMPLIANCE: {irdai.get('compliance_rating', 'Unknown')} — Score: {irdai.get('compliance_score', 0)}/7
COMPLIANCE FLAGS: {', '.join(k for k, v in (irdai.get('compliance_flags') or {}).items() if v and not k.startswith('_'))}

STRUCTURAL RISK: {broker.get('structural_risk_level', 'Unknown')}
TRANSPARENCY SCORE: {broker.get('transparency_score', 0)}/100
RISK DENSITY: {broker.get('risk_density_index', 0)} (0=safe, 1=maximum risk)
DATA SUFFICIENT: {broker.get('data_sufficient', False)}
RECOMMENDATION: {broker.get('recommendation', 'N/A')}

RED FLAGS: {'; '.join(red_flags) if red_flags else 'None'}
POSITIVE FLAGS: {'; '.join(pos_flags) if pos_flags else 'None'}

BUYER CHECKLIST:
{chr(10).join(f'  {i+1}. {item}' for i, item in enumerate(checklist))}"""

        system_instruction = """You are an expert Indian health insurance advisor helping a policyholder evaluate a policy before purchase.
Answer clearly and specifically using the report data above.
Be direct about risks — do not soften warnings about High Risk clauses.
For "Not Found" clauses, explain that the data was not detectable and advise the user to ask the insurer directly.
Reference specific clause names (e.g., 'room_rent_sublimit', 'waiting_period') in plain English.
If asked about a specific clause, explain what it means for the policyholder in practical terms.
Do not make up clause values — only reference what is in the report data.
Write 3–5 sentences in plain English. No bullet points. No JSON."""

    else:
        # Audit context
        appeal  = report_data.get("appeal_strength", {})
        steps   = report_data.get("reapplication_steps", [])
        weak    = report_data.get("weak_points", [])
        strong  = report_data.get("strong_points", [])
        reg_ctx = str(report_data.get("regulatory_considerations", ""))[:500]
        missing = report_data.get("missing_documents", [])
        conf    = report_data.get("confidence", "Unknown")

        context_block = f"""REPORT TYPE: Post-Rejection Claim Audit

REJECTION REASON: {report_data.get('why_rejected', 'Not specified')}
POLICY CLAUSE APPLIED: {report_data.get('policy_clause_detected', 'Not identified')}
CLAUSE ALIGNMENT WITH REJECTION: {report_data.get('clause_alignment', 'Unknown')}
SYSTEM CONFIDENCE: {conf}

APPEAL STRENGTH: {appeal.get('label', 'Unknown')} — {appeal.get('percentage', 0)}%
APPEAL REASONING: {appeal.get('reasoning', 'Not available')}

STRONG POINTS FOR POLICYHOLDER: {'; '.join(strong) if strong else 'None identified'}
WEAK POINTS / CHALLENGES: {'; '.join(weak) if weak else 'None identified'}

MISSING DOCUMENTS: {', '.join(missing) if missing else 'None identified'}

NEXT STEPS (in order):
{chr(10).join(f'  {i+1}. {s}' for i, s in enumerate(steps[:5]))}

REGULATORY CONTEXT:
{reg_ctx or 'No specific regulatory references retrieved.'}"""

        system_instruction = """You are an expert Indian insurance claim advisor helping a policyholder understand their post-rejection audit report.
Answer clearly and specifically using the report data above.
If asked about appeal strength, always cite the percentage and explain the reasoning.
If asked about next steps, give the steps in order with time limits (IRDAI: 15 days, Ombudsman: 1 year from final reply).
If the clause alignment is Weak or Not Detected, explain this is an argument in the policyholder's favour.
Mention the IRDAI 8-year moratorium rule if the question relates to pre-existing disease rejection.
Do not make up regulatory references not in the context above.
Write 3–5 sentences in plain English. No bullet points. No JSON."""

    return f"""{system_instruction}

{context_block}

CONVERSATION HISTORY:
{history_text}

USER QUESTION: {user_question}

ANSWER (3-5 sentences, plain English, grounded in the report data above):"""