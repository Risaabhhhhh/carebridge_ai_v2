def extract_structured_features(policy_text: str):
    """
    Extract deterministic insurance policy features
    for risk overrides and scoring.

    Lightweight, fast, and explainable.
    """

    text = policy_text.lower()

    features = {
        # ----------------------------------
        # Waiting Period Detection
        # ----------------------------------
        "has_waiting_period": "waiting period" in text,
        "waiting_period_years": (
            4 if "4 year" in text else
            3 if "3 year" in text else
            2 if "2 year" in text else
            1 if "1 year" in text else 0
        ),

        # ----------------------------------
        # Pre-existing Disease
        # ----------------------------------
        "mentions_pre_existing": "pre-existing" in text or "pre existing" in text,

        # ----------------------------------
        # Room Rent Limits
        # ----------------------------------
        "room_rent_cap": "room rent" in text,
        "room_rent_percent": (
            1 if "1%" in text else
            2 if "2%" in text else 0
        ),

        # ----------------------------------
        # Co-payment
        # ----------------------------------
        "co_payment": "co-pay" in text or "copay" in text or "co payment" in text,
        "co_payment_percentage": (
            30 if "30%" in text else
            25 if "25%" in text else
            20 if "20%" in text else
            10 if "10%" in text else 0
        ),

        # ----------------------------------
        # Disease Caps / Sublimits
        # ----------------------------------
        "disease_caps": any(keyword in text for keyword in [
            "capped",
            "limit per",
            "maximum payable",
            "sublimit",
            "sub-limit"
        ]),

        # ----------------------------------
        # Consumables / Non-medical Exclusion
        # ----------------------------------
        "consumables_exclusion": any(keyword in text for keyword in [
            "non-medical consumables",
            "consumables excluded",
            "ppe kit",
            "gloves",
            "administrative charges"
        ]),

        # ----------------------------------
        # Restoration Benefit
        # ----------------------------------
        "restoration_benefit": "restoration benefit" in text,

        # ----------------------------------
        # Procedural Requirements
        # ----------------------------------
        "procedural_conditions": any(keyword in text for keyword in [
            "pre-authorization",
            "intimation within",
            "inform within",
            "documents within",
            "delay in submission"
        ]),

        # ----------------------------------
        # Transparency Indicators
        # ----------------------------------
        "free_look_period": "free look period" in text,
        "grievance_redressal": "grievance" in text,
        "ombudsman_reference": "ombudsman" in text,
        "irdai_reference": "irdai" in text,
    }

    return features