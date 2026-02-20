# services/irdai_compliance_engine.py

from schemas.pre_purchase import IRDAICompliance



def evaluate_irdai_compliance(policy_text: str) -> IRDAICompliance:
    """
    Detects presence of key IRDAI regulatory compliance markers
    and returns structured compliance report.
    """

    text = policy_text.lower()

    compliance_flags = {
        "grievance_redressal_mentioned": False,
        "ombudsman_mentioned": False,
        "irdai_reference": False,
        "free_look_period": False,
        "portability_clause": False,
        "claim_settlement_timeline": False,
        "exclusion_transparency": False,
    }

    # ----------------------------------
    # Keyword-based compliance detection
    # ----------------------------------

    if "grievance" in text:
        compliance_flags["grievance_redressal_mentioned"] = True

    if "ombudsman" in text:
        compliance_flags["ombudsman_mentioned"] = True

    if "irdai" in text:
        compliance_flags["irdai_reference"] = True

    if "free look" in text or "free-look" in text:
        compliance_flags["free_look_period"] = True

    if "portability" in text:
        compliance_flags["portability_clause"] = True

    if "settlement" in text or "claim processed within" in text:
        compliance_flags["claim_settlement_timeline"] = True

    if "exclusion" in text:
        compliance_flags["exclusion_transparency"] = True

    # ----------------------------------
    # Scoring
    # ----------------------------------

    compliance_score = sum(compliance_flags.values())

    if compliance_score >= 6:
        rating = "High Compliance"
    elif compliance_score >= 3:
        rating = "Moderate Compliance"
    else:
        rating = "Low Compliance"

    return IRDAICompliance(
        compliance_flags=compliance_flags,
        compliance_score=compliance_score,
        compliance_rating=rating
    )
