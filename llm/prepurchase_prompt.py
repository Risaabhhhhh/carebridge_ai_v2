def prepurchase_risk_prompt(policy_text: str) -> str:
    return f"""You are an IRDAI-compliant Indian health insurance policy risk classifier.

Your task: Read the policy text below and classify 10 specific clauses by their risk level to the policyholder.

IMPORTANT:
You MUST classify every clause.
Use "Not Found" ONLY if the clause is completely absent.
If wording implies the clause, infer based on meaning.

NOTE:
Policies may use synonyms, examples, or indirect wording.
Infer meaning where applicable.

ALLOWED VALUES (use exactly as written):
- "Low Risk"
- "Moderate Risk"
- "High Risk"
- "Not Found"

CLASSIFICATION GUIDE:
- waiting_period      : How long before claims are valid? (>3 years = High, 1-3 years = Moderate, <1 year = Low)
- pre_existing_disease: Are pre-existing conditions covered? (excluded entirely = High, partial = Moderate, covered = Low)
- room_rent_sublimit  : Is room rent capped? (≤1% of SI = High, 1-2% = Moderate, no cap = Low)
- disease_specific_caps: Are specific diseases capped below SI? (yes = High, minor caps = Moderate, none = Low)
- co_payment          : Is patient required to pay a share? (≥20% = High, 10-19% = Moderate, <10% = Low)
- exclusions_clarity  : Are exclusions vague or buried? (vague = High, partial = Moderate, clear = Low)
- claim_procedure_complexity: Is the claim process complex? (many steps/tight deadlines = High, moderate = Moderate, simple = Low)
- sublimits_and_caps  : Are there multiple sublimits reducing coverage? (many = High, few = Moderate, none = Low)
- restoration_benefit : Is exhausted sum insured restored? (not available = High, partial = Moderate, full = Low)
- transparency_of_terms: Are terms clearly written and accessible? (hidden/complex = High, mixed = Moderate, clear = Low)

STRICT RULES:
- Output ONLY the JSON object.
- Do not explain.
- Do not add text before or after.
- Use ONLY the allowed values.

POLICY TEXT:
{policy_text}

JSON OUTPUT:"""