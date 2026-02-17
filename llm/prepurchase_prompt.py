def prepurchase_risk_prompt(policy_text: str) -> str:
    return f"""
You are a policy risk classifier.

You MUST classify each feature into one of these values:
- Low Risk
- Moderate Risk
- High Risk
- Not Found

You MUST NOT return numbers.
You MUST NOT return years.
You MUST NOT return percentages.
You MUST NOT explain.
You MUST NOT add commentary.
You MUST return JSON only.

Policy Text:
\"\"\"{policy_text}\"\"\"

Example Output Format:
{{
  "waiting_period": "Moderate Risk",
  "pre_existing_disease": "High Risk",
  "room_rent_sublimit": "High Risk",
  "disease_specific_caps": "Not Found",
  "co_payment": "High Risk",
  "exclusions_clarity": "Low Risk",
  "claim_procedure_complexity": "Low Risk",
  "sublimits_and_caps": "Moderate Risk",
  "restoration_benefit": "Low Risk",
  "transparency_of_terms": "Moderate Risk"
}}

Now return JSON only.
"""
