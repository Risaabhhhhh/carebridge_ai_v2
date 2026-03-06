# llm/report_chat_prompt.py
#
# Multilingual-aware prompt builder for the report chat service.
# Lang instruction is placed FIRST — LLMs follow early instructions better.

from llm.multilingual_translations import SYSTEM_LANG_INSTRUCTION


def report_chat_prompt(
    report_data: dict,
    history: list[dict],
    user_question: str,
    lang: str = "en",
) -> str:
    lang = lang if lang in SYSTEM_LANG_INSTRUCTION else "en"
    lang_instruction = SYSTEM_LANG_INSTRUCTION[lang]

    is_prepurchase = "clause_risk" in report_data and "appeal_strength" not in report_data

    if is_prepurchase:
        report_type = "PRE-PURCHASE POLICY ANALYSIS"
        cr     = report_data.get("clause_risk", {})
        sb     = report_data.get("score_breakdown", {})
        irdai  = report_data.get("irdai_compliance", {})
        broker = report_data.get("broker_risk_analysis", {})
        report_summary = f"""
POLICY SCORE: {sb.get('adjusted_score', 'N/A')}/100
RATING: {report_data.get('overall_policy_rating', 'Unknown')}
CONFIDENCE: {report_data.get('confidence', 'Unknown')}

CLAUSE RISK ASSESSMENT:
{_format_dict(cr)}

IRDAI COMPLIANCE:
  Rating: {irdai.get('compliance_rating', 'Unknown')}
  Score:  {irdai.get('compliance_score', 'N/A')}/7
  Flags:  {_format_dict(irdai.get('compliance_flags', {}))}

STRUCTURAL RISK:
  Level:              {broker.get('structural_risk_level', 'Unknown')}
  Transparency Score: {broker.get('transparency_score', 'N/A')}

RED FLAGS: {', '.join(report_data.get('red_flags', [])) or 'None'}
POSITIVE FLAGS: {', '.join(report_data.get('positive_flags', [])) or 'None'}

BUYER CHECKLIST:
{_format_list(report_data.get('checklist_for_buyer', []))}"""

    else:
        report_type = "CLAIM REJECTION AUDIT"
        appeal = report_data.get("appeal_strength", {})
        report_summary = f"""
CASE SUMMARY: {report_data.get('case_summary', 'N/A')}
WHY REJECTED: {report_data.get('why_rejected', 'N/A')}
CLAUSE DETECTED: {report_data.get('policy_clause_detected', 'N/A')}
CLAUSE ALIGNMENT: {report_data.get('clause_alignment', 'N/A')}
CONFIDENCE: {report_data.get('confidence', 'Unknown')}

APPEAL STRENGTH:
  Label:      {appeal.get('label', 'Unknown')}
  Percentage: {appeal.get('percentage', 'N/A')}%
  Reasoning:  {appeal.get('reasoning', 'N/A')}

STRONG POINTS: {', '.join(report_data.get('strong_points', [])) or 'None'}
WEAK POINTS:   {', '.join(report_data.get('weak_points', [])) or 'None'}

REAPPLICATION STEPS:
{_format_list(report_data.get('reapplication_steps', []))}

REGULATORY CONSIDERATIONS: {report_data.get('regulatory_considerations', 'N/A')}"""

    history_block = ""
    if history:
        lines = []
        for msg in history[-6:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{role}: {msg['content']}")
        history_block = "\nCONVERSATION HISTORY:\n" + "\n".join(lines) + "\n"

    # ── Lang instruction is FIRST so the model sees it before anything else ──
    return f"""{lang_instruction}

You are CareBridge AI — an Indian health insurance expert.
You answer questions about a specific {report_type} report.
Only answer questions about this report and Indian health insurance topics (IRDAI, claims, policies, premiums).
For unrelated questions, redirect to the report or suggest consulting a licensed advisor.
Do not provide legal or financial advice — provide regulatory information and explain options.

REPORT TYPE: {report_type}
REPORT DATA:
{report_summary.strip()}
{history_block}
USER QUESTION: {user_question}

ANSWER:"""


def learn_prompt(question: str, lang: str = "en") -> str:
    lang_instruction = SYSTEM_LANG_INSTRUCTION.get(lang, SYSTEM_LANG_INSTRUCTION["en"])

    return f"""<start_of_turn>system
{lang_instruction}

You are an insurance education assistant for Indian policyholders.
Your job is to explain insurance concepts in simple, jargon-free language.
Always use Indian examples (rupees, IRDAI rules, Indian hospitals).
Be concise — 3 to 5 sentences maximum.
If relevant, cite the specific IRDAI regulation.
<end_of_turn>
<start_of_turn>user
{question}
<end_of_turn>
<start_of_turn>model
"""


def _format_dict(d: dict) -> str:
    if not d:
        return "  None"
    return "\n".join(f"  {k}: {v}" for k, v in d.items())


def _format_list(lst: list) -> str:
    if not lst:
        return "  None"
    return "\n".join(f"  {i+1}. {item}" for i, item in enumerate(lst))