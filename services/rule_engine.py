# services/rule_engine.py

from schemas.intermediate import ClauseMatchResult


# --------------------------------------------------
# 1️⃣ Clause Category Rule Detection
# --------------------------------------------------
def classify_rejection_rule_based(rejection_text: str | None):

    if not rejection_text:
        return None

    text = rejection_text.lower()

    if "pre-existing" in text or "pre existing" in text:
        return "Pre-existing disease"

    if "waiting period" in text:
        return "Waiting period"

    if "room rent" in text or "room limit" in text:
        return "Room rent limit"

    if "co-pay" in text or "copay" in text:
        return "Co-payment"

    if "authorization" in text or "pre-authorization" in text:
        return "Authorization requirement"

    if "document" in text or "insufficient" in text:
        return "Insufficient documentation"

    if "cosmetic" in text:
        return "Policy exclusion"

    return None


# --------------------------------------------------
# 2️⃣ Override Layer (Hybrid Enforcement)
# --------------------------------------------------
def apply_rule_overrides(clause_result, rejection_text):

    category = classify_rejection_rule_based(rejection_text)

    if not category:
        return clause_result  # No override

    # If rule detected something strong, override weak LLM outputs
    if clause_result.clause_category == "Other / unclear" or clause_result.confidence == "Low":

        return ClauseMatchResult(
            clause_category=category,
            clause_detected="Detected via rule-based keyword match",
            clause_clarity="High",
            rejection_alignment="Strong",
            explanation="Rejection reason directly matches standard policy category.",
            confidence="High"
        )

    return clause_result

def apply_waiting_period_override(clause_result, policy_text, medical_text):

    if clause_result.clause_category != "Waiting period":
        return clause_result

    policy_text = (policy_text or "").lower()
    medical_text = (medical_text or "").lower()

    # Check if policy mentions waiting period duration
    if "waiting period" in policy_text:

        # If medical text suggests treatment occurred AFTER waiting period
        if "after 2 years" in medical_text or "after policy completion" in medical_text:
            clause_result.rejection_alignment = "Weak"
            clause_result.explanation = (
                "Medical documentation suggests waiting period may have been completed."
            )
            clause_result.confidence = "Medium"

    return clause_result
