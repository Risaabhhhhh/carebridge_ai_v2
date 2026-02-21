from config.prepurchase_scoring_config import SCORING_CONFIG


def compute_policy_score(clause_risk, compliance_data: dict) -> dict:
    """
    Compute a 0-100 policy score from clause risk assessment and IRDAI compliance.

    Returns a dict with base_score, adjusted_score, risk_index, red_flags,
    positive_flags, and high_risk_count. Rating is intentionally excluded —
    the engine recomputes it after broker adjustments.
    """

    base_score = SCORING_CONFIG["base_score"]
    score = float(base_score)   # ✅ keep as float — engine adds adjustments after this

    red_flags = []
    positive_flags = []
    high_risk_count = 0

    financial_weights = SCORING_CONFIG["financial_weights"]
    financial_fields = SCORING_CONFIG["financial_fields"]

    # --------------------------------------------------
    # 1️⃣ Financial Risk Impact
    # --------------------------------------------------
    for field_name in financial_fields:
        field_value = getattr(clause_risk, field_name, "Not Found")
        penalty = financial_weights.get(field_value, 0)
        score += penalty

        if field_value == "High Risk":
            red_flags.append(f"{field_name} marked as High Risk.")
            high_risk_count += 1

    # --------------------------------------------------
    # 2️⃣ Positive Boost
    # --------------------------------------------------
    for field_name, boost_value in SCORING_CONFIG["positive_boost"].items():
        field_value = getattr(clause_risk, field_name, "Not Found")
        if field_value == "Low Risk":
            score += boost_value
            positive_flags.append(f"{field_name} is favorable.")

    # --------------------------------------------------
    # 3️⃣ Compliance Boost  (scale-agnostic)
    # --------------------------------------------------
    if compliance_data is None:
        print("⚠️ compliance_data is None — skipping compliance boost")
        compliance_boost = 0.0
    else:
        raw_compliance = compliance_data.get("compliance_score")

        if raw_compliance is None:
            print("⚠️ compliance_score key missing from compliance_data")
            compliance_boost = 0.0
        else:
            # ✅ normalise to 0-1 using config scale (default 7 for IRDAI 7-point flags)
            compliance_scale = SCORING_CONFIG.get("compliance_scale", 7)
            max_boost = SCORING_CONFIG["compliance_max_boost"]
            normalised = max(0.0, min(float(raw_compliance) / compliance_scale, 1.0))
            compliance_boost = normalised * max_boost

    score += compliance_boost

    # --------------------------------------------------
    # 4️⃣ High-risk field penalty multiplier
    #    If majority of fields are high risk, apply extra penalty
    # --------------------------------------------------
    total_fields = len(financial_fields)
    if total_fields > 0 and high_risk_count / total_fields >= 0.6:
        extra_penalty = SCORING_CONFIG.get("majority_high_risk_penalty", -10)
        score += extra_penalty
        red_flags.append(
            f"Majority of clauses ({high_risk_count}/{total_fields}) are High Risk — "
            "policy has systemic risk."
        )

    # --------------------------------------------------
    # 5️⃣ Clamp (keep as float for engine's broker adjustments)
    # --------------------------------------------------
    score = max(0.0, min(100.0, score))

    # --------------------------------------------------
    # 6️⃣ Risk Index
    # --------------------------------------------------
    risk_index = round((100.0 - score) / 100.0, 2)

    return {
        "base_score": base_score,
        "adjusted_score": score,       # float — engine will clamp+round at the end
        "risk_index": risk_index,
        "red_flags": red_flags,
        "positive_flags": positive_flags,
        "high_risk_count": high_risk_count,
    }