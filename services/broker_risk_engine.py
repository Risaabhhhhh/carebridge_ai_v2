# services/broker_risk_engine.py

from config.prepurchase_scoring_config import SCORING_CONFIG


# All 10 clause fields — must match ClauseRiskAssessment field names
_ALL_CLAUSE_FIELDS = [
    "waiting_period",
    "pre_existing_disease",
    "room_rent_sublimit",
    "disease_specific_caps",
    "co_payment",
    "exclusions_clarity",
    "claim_procedure_complexity",
    "sublimits_and_caps",
    "restoration_benefit",
    "transparency_of_terms",
]

# Weighted risk contribution per value
_RISK_WEIGHTS = {
    "High Risk": 1.0,
    "Moderate Risk": 0.5,
    "Low Risk": 0.0,
    "Not Found": 0.0,   # absence of data is handled separately
}


def analyze_broker_risk(clause_risk, compliance_data: dict) -> dict:
    """
    Analyzes structural risk from clause distribution and IRDAI compliance.
    Returns a dict matching BrokerRiskAnalysis schema fields.
    """

    # --------------------------------------------------
    # 1️⃣ Risk Density (all 10 fields, weighted)
    # --------------------------------------------------
    total_fields = len(_ALL_CLAUSE_FIELDS)
    weighted_risk_sum = 0.0
    high_risk_count = 0
    not_found_count = 0

    for field_name in _ALL_CLAUSE_FIELDS:
        value = getattr(clause_risk, field_name, "Not Found")
        weighted_risk_sum += _RISK_WEIGHTS.get(value, 0.0)

        if value == "High Risk":
            high_risk_count += 1
        elif value == "Not Found":
            not_found_count += 1

    # Normalise to 0-1 (max possible = all High Risk = total_fields * 1.0)
    risk_density_index = round(weighted_risk_sum / total_fields, 2)

    # --------------------------------------------------
    # 2️⃣ Transparency Score (scale-agnostic)
    # --------------------------------------------------
    compliance_score = compliance_data.get("compliance_score", 0) if compliance_data else 0
    compliance_scale = SCORING_CONFIG.get("compliance_scale", 7)
    transparency_score = round(
        (float(compliance_score) / compliance_scale) * 100
    )
    transparency_score = max(0, min(100, transparency_score))

    # --------------------------------------------------
    # 3️⃣ Data Sufficiency Check
    # --------------------------------------------------
    data_sufficient = not_found_count <= (total_fields // 2)  # >50% found = sufficient

    # --------------------------------------------------
    # 4️⃣ Structural Risk Level
    # --------------------------------------------------
    if not data_sufficient:
        # Too many unknowns — can't confidently assess
        structural_risk = "Insufficient Data"
    elif risk_density_index >= 0.6 and transparency_score < 40:
        structural_risk = "High"
    elif risk_density_index >= 0.6 or (risk_density_index >= 0.4 and transparency_score < 50):
        structural_risk = "Elevated"
    elif risk_density_index >= 0.2:
        structural_risk = "Moderate"
    else:
        structural_risk = "Balanced"

    # --------------------------------------------------
    # 5️⃣ Recommendation
    # --------------------------------------------------
    recommendations = {
        "High": (
            "Policy shows concentrated financial risk and low regulatory transparency. "
            f"{high_risk_count} out of {total_fields} clauses are High Risk. "
            "Seek written clarifications from insurer before purchase. "
            "Consider comparing alternatives."
        ),
        "Elevated": (
            "Policy has moderate-to-high financial risk concentration. "
            "Clarify key clauses with your broker before purchase. "
            "Pay special attention to exclusions and sublimits."
        ),
        "Moderate": (
            "Policy has some risk areas but no systemic imbalance. "
            "Review flagged clauses and confirm with insurer."
        ),
        "Balanced": (
            "No major structural imbalance detected. "
            "Standard due diligence recommended before purchase."
        ),
        "Insufficient Data": (
            "Too many clauses could not be detected in the provided policy text. "
            "Upload a more complete version of the policy wording for accurate assessment."
        ),
    }

    recommendation = recommendations.get(structural_risk, "Review policy carefully.")

    return {
        "risk_density_index": risk_density_index,
        "transparency_score": transparency_score,
        "structural_risk_level": structural_risk,
        "recommendation": recommendation,
        "high_risk_count": high_risk_count,
        "not_found_count": not_found_count,
        "data_sufficient": data_sufficient,
    }