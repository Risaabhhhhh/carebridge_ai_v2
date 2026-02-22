def prepurchase_risk_prompt(policy_text: str) -> str:
    """
    Prompt for MedGemma 4B-IT via apply_chat_template.

    This is the USER turn content only — the system instruction is
    injected by generation.py via the chat template messages list.

    Key design decisions:
    - Compact classification guide (saves tokens, model still gets full guidance)
    - Example output right before the policy text (in-context learning)
    - Explicit "JSON OUTPUT:" marker right at the end (anchors assistant turn)
    - No unicode box-drawing chars (some tokenizers mangle them)
    """
    return f"""Classify 10 health insurance policy clauses by risk level.

ALLOWED VALUES (use EXACT wording only):
"Low Risk" | "Moderate Risk" | "High Risk" | "Not Found"

Use "Not Found" ONLY if the clause is genuinely absent from the text.
Infer from synonyms and indirect language — do not default to Not Found.

CLASSIFICATION RULES:
waiting_period: >3yr=High, 1-3yr=Moderate, <1yr=Low (look for months/years)
pre_existing_disease: excluded=High, partial/conditional=Moderate, covered=Low
room_rent_sublimit: cap<=1%SI=High, 1-2%=Moderate, no cap=Low
disease_specific_caps: significant caps=High, minor caps=Moderate, none=Low
co_payment: >=20%=High, 10-19%=Moderate, <10%=Low (look for co-pay/cost sharing)
exclusions_clarity: vague/hidden=High, partial=Moderate, clear=Low
claim_procedure_complexity: strict deadlines/many steps=High, moderate=Moderate, simple=Low
sublimits_and_caps: multiple=High, few=Moderate, none=Low
restoration_benefit: absent=High, partial=Moderate, full reinstatement=Low
transparency_of_terms: complex/hidden=High, mixed=Moderate, clearly defined=Low

SEMANTIC HINTS:
- "capped", "limit", "maximum payable" -> disease caps or sublimits
- "intimation within", "inform within" -> claim complexity
- "non-medical expenses excluded" -> exclusions clarity
- "restored after exhaustion", "reinstated" -> restoration benefit
- "co-pay", "cost sharing" -> co-payment
- "room rent limited to X% of sum insured" -> room rent sublimit
- "free look", "grievance", "ombudsman" -> transparency signals

OUTPUT: JSON object with exactly these 10 keys. No text before or after.

EXAMPLE (use real values from the policy, not these):
{{
  "waiting_period": "Moderate Risk",
  "pre_existing_disease": "High Risk",
  "room_rent_sublimit": "High Risk",
  "disease_specific_caps": "Moderate Risk",
  "co_payment": "Low Risk",
  "exclusions_clarity": "Moderate Risk",
  "claim_procedure_complexity": "Moderate Risk",
  "sublimits_and_caps": "Moderate Risk",
  "restoration_benefit": "High Risk",
  "transparency_of_terms": "Low Risk"
}}

POLICY TEXT:
{policy_text}

JSON OUTPUT:"""