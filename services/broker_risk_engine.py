def analyze_broker_risk(clause_risk, compliance_data):

    # ----------------------------------
    # 1️⃣ Risk Density (Financial Penalty Concentration)
    # ----------------------------------

    financial_fields = [
        clause_risk.waiting_period,
        clause_risk.pre_existing_disease,
        clause_risk.room_rent_sublimit,
        clause_risk.co_payment,
        clause_risk.sublimits_and_caps
    ]

    total_fields = len(financial_fields)
    high_risk_count = sum(1 for f in financial_fields if f == "High Risk")

    risk_density_index = round(high_risk_count / total_fields, 2)

    # ----------------------------------
    # 2️⃣ Transparency Score (Regulatory Presence)
    # ----------------------------------

    compliance_score = compliance_data.get("compliance_score", 0)
    max_possible = 7  # total compliance checks
    transparency_score = round((compliance_score / max_possible) * 100)

    # ----------------------------------
    # 3️⃣ Structural Risk Level
    # ----------------------------------

    if risk_density_index >= 0.6 and transparency_score < 40:
        structural_risk = "High"
    elif risk_density_index >= 0.4:
        structural_risk = "Elevated"
    else:
        structural_risk = "Balanced"

    # ----------------------------------
    # 4️⃣ Recommendation
    # ----------------------------------

    if structural_risk == "High":
        recommendation = (
            "Policy shows concentrated financial penalties and low regulatory transparency. "
            "Seek written clarifications before purchase."
        )
    elif structural_risk == "Elevated":
        recommendation = (
            "Policy has moderate financial risk concentration. "
            "Clarify key clauses with broker before purchase."
        )
    else:
        recommendation = "No major structural imbalance detected."

    return {
        "risk_density_index": risk_density_index,
        "transparency_score": transparency_score,
        "structural_risk_level": structural_risk,
        "recommendation": recommendation
    }
