from config.prepurchase_scoring_config import SCORING_CONFIG


def compute_policy_score(clause_risk, compliance_data):

    base_score = SCORING_CONFIG["base_score"]
    score = base_score

    red_flags = []
    positive_flags = []

    financial_weights = SCORING_CONFIG["financial_weights"]
    financial_fields = SCORING_CONFIG["financial_fields"]

    # ----------------------------------
    # 1️⃣ Financial Risk Impact
    # ----------------------------------

    for field_name in financial_fields:

        field_value = getattr(clause_risk, field_name, "Not Found")
        penalty = financial_weights.get(field_value, 0)

        score += penalty

        if field_value == "High Risk":
            red_flags.append(f"{field_name} marked as High Risk.")

    # ----------------------------------
    # 2️⃣ Positive Boost
    # ----------------------------------

    for field_name, boost_value in SCORING_CONFIG["positive_boost"].items():

        field_value = getattr(clause_risk, field_name, "Not Found")

        if field_value == "Low Risk":
            score += boost_value
            positive_flags.append(f"{field_name} is favorable.")

    # ----------------------------------
    # 3️⃣ Compliance Weight
    # ----------------------------------

    compliance_score = compliance_data.get("compliance_score", 0)
    max_boost = SCORING_CONFIG["compliance_max_boost"]

    compliance_boost = (compliance_score / 7) * max_boost
    score += compliance_boost

    # ----------------------------------
    # 4️⃣ Clamp
    # ----------------------------------

    score = max(0, min(100, int(score)))

    # ----------------------------------
    # 5️⃣ Rating Mapping
    # ----------------------------------

    if score >= 80:
        rating = "Strong"
    elif score >= 55:
        rating = "Moderate"
    else:
        rating = "Weak"

    # ----------------------------------
    # 6️⃣ Risk Index (Professional Touch)
    # ----------------------------------

    risk_index = round((100 - score) / 100, 2)

    return {
        "base_score": base_score,
        "adjusted_score": score,
        "rating": rating,
        "risk_index": risk_index,
        "red_flags": red_flags,
        "positive_flags": positive_flags
    }
