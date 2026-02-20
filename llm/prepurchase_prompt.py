def prepurchase_risk_prompt(policy_text: str) -> str:
    return f"""
Return ONLY valid JSON.

Do NOT explain.
Do NOT add analysis.
Do NOT include thoughts.
Do NOT include markdown.
Do NOT include text before or after JSON.

Allowed values:
- Low Risk
- Moderate Risk
- High Risk
- Not Found

Policy Text:
\"\"\"{policy_text}\"\"\"

Return EXACTLY this JSON structure:

{{
  "waiting_period": "",
  "pre_existing_disease": "",
  "room_rent_sublimit": "",
  "disease_specific_caps": "",
  "co_payment": "",
  "exclusions_clarity": "",
  "claim_procedure_complexity": "",
  "sublimits_and_caps": "",
  "restoration_benefit": "",
  "transparency_of_terms": ""
}}
"""