def prepurchase_risk_prompt(policy_text: str) -> str:
    return f"""You are an IRDAI-compliant Indian health insurance policy risk classifier.

Your task: Read the policy text below and classify 10 specific clauses by their risk level to the policyholder.

ALLOWED VALUES (use exactly as written):
- "Low Risk"
- "Moderate Risk"
- "High Risk"
- "Not Found"

CLASSIFICATION GUIDE:
- waiting_period      : How long before claims are valid? (>3 years = High, 1-3 years = Moderate, <1 year = Low)
- pre_existing_disease: Are pre-existing conditions covered? (excluded entirely = High, partial = Moderate, covered = Low)
- room_rent_sublimit  : Is room rent capped? (≤1% of SI = High, 1-2% = Moderate, no cap = Low)
- disease_specific_caps: Are specific diseases capped below SI? (yes, significantly = High, minor caps = Moderate, no = Low)
- co_payment          : Is patient required to pay a share? (≥20% = High, 10-19% = Moderate, <10% = Low)
- exclusions_clarity  : Are exclusions vague or buried? (vague/long list = High, some clarity = Moderate, clear = Low)
- claim_procedure_complexity: Is the claim process complex? (many steps/tight deadlines = High, moderate = Moderate, simple = Low)
- sublimits_and_caps  : Are there many sublimits reducing effective coverage? (yes = High, few = Moderate, none = Low)
- restoration_benefit : Is exhausted sum insured restored? (not available = High, partial = Moderate, full = Low)
- transparency_of_terms: Are terms clearly written and accessible? (hidden/complex = High, mixed = Moderate, clear = Low)

EXAMPLE OUTPUT (do not copy values — classify based on the actual policy text):
{{
  "waiting_period": "High Risk",
  "pre_existing_disease": "Moderate Risk",
  "room_rent_sublimit": "High Risk",
  "disease_specific_caps": "Moderate Risk",
  "co_payment": "Low Risk",
  "exclusions_clarity": "High Risk",
  "claim_procedure_complexity": "Moderate Risk",
  "sublimits_and_caps": "High Risk",
  "restoration_benefit": "Not Found",
  "transparency_of_terms": "Moderate Risk"
}}

STRICT RULES:
- Output ONLY the JSON object. No text before or after.
- Do not explain your reasoning.
- Do not use markdown or code blocks.
- Use ONLY the allowed values listed above.
- If a clause is not mentioned in the policy, use "Not Found".

POLICY TEXT:
{policy_text}

JSON OUTPUT:"""