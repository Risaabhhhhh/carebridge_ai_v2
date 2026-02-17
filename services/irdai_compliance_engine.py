# services/irdai_compliance_engine.py

import re


def detect_irdai_compliance(policy_text: str):

    text = policy_text.lower()

    compliance = {
        "grievance_redressal_mentioned": False,
        "ombudsman_mentioned": False,
        "irdai_reference": False,
        "free_look_period": False,
        "portability_clause": False,
        "claim_settlement_timeline": False,
        "exclusion_transparency": False,
    }

    if "grievance" in text:
        compliance["grievance_redressal_mentioned"] = True

    if "ombudsman" in text:
        compliance["ombudsman_mentioned"] = True

    if "irdai" in text:
        compliance["irdai_reference"] = True

    if "free look" in text:
        compliance["free_look_period"] = True

    if "portability" in text:
        compliance["portability_clause"] = True

    if "settlement" in text or "claim processed within" in text:
        compliance["claim_settlement_timeline"] = True

    if "exclusion" in text:
        compliance["exclusion_transparency"] = True

    compliance_score = sum(compliance.values())

    if compliance_score >= 6:
        rating = "High Compliance"
    elif compliance_score >= 3:
        rating = "Moderate Compliance"
    else:
        rating = "Low Compliance"

    return compliance, compliance_score, rating
