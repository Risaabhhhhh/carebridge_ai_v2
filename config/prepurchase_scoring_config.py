SCORING_CONFIG = {

    # -------------------------------------------------------
    # Base score — deductions and boosts applied from here
    # -------------------------------------------------------
    "base_score": 75,   # slightly lower start gives more room to earn upward

    # -------------------------------------------------------
    # Financial risk weights — applied to ALL 10 clause fields
    # Worst case: 10 × -12 = -120 → clamped to 0
    # Best case: boosts + compliance bring score up from 75
    # -------------------------------------------------------
    "financial_weights": {
        "High Risk":     -12,
        "Moderate Risk":  -5,
        "Low Risk":        0,
        "Not Found":       0,   # ✅ absence of data ≠ policy flaw
    },

    # -------------------------------------------------------
    # All 10 clause fields evaluated for financial risk
    # -------------------------------------------------------
    "financial_fields": [
        "waiting_period",
        "pre_existing_disease",
        "room_rent_sublimit",
        "disease_specific_caps",       # ✅ added
        "co_payment",
        "exclusions_clarity",          # ✅ added — High Risk here should penalise
        "claim_procedure_complexity",  # ✅ added — same
        "sublimits_and_caps",
        "restoration_benefit",         # ✅ added — missing restoration = risk
        "transparency_of_terms",       # ✅ added
    ],

    # -------------------------------------------------------
    # Positive boost — only applied when field is "Low Risk"
    # Weighted by consumer impact
    # -------------------------------------------------------
    "positive_boost": {
        "restoration_benefit":        6,   # high impact — protects full coverage
        "exclusions_clarity":         4,   # clear exclusions = informed buyer
        "claim_procedure_complexity": 4,   # simple claims = accessible coverage
        "transparency_of_terms":      3,   # readable policy = consumer trust
        "co_payment":                 3,   # low co-pay = less out-of-pocket
    },

    # -------------------------------------------------------
    # IRDAI compliance boost — max points for full compliance
    # Normalised against compliance_scale in scoring engine
    # -------------------------------------------------------
    "compliance_max_boost":  20,   # reduced from 25 — compliance is a signal, not a score driver
    "compliance_scale":       7,   # IRDAI has 7 weighted compliance flags

    # -------------------------------------------------------
    # Systemic risk penalty — applied when majority of fields are High Risk
    # See: prepurchase_scoring.py majority_high_risk check
    # -------------------------------------------------------
    "majority_high_risk_penalty": -10,

    # -------------------------------------------------------
    # Score band thresholds (used by engine for rating)
    # -------------------------------------------------------
    "rating_thresholds": {
        "Strong":   80,
        "Moderate": 55,
        # below Moderate = "Weak"
    },
}


# -------------------------------------------------------
# SCORING MATH REFERENCE
# -------------------------------------------------------
# Worst case  : 75 + (10 × -12) + (-10 systemic) + 0 compliance = -55 → clamped to 0
# Average case: 75 + (5 × -5) + (2 × 4 boosts) + 12 compliance  = 75 - 25 + 8 + 12 = 70
# Best case   : 75 + (5 × 4 boosts) + 20 compliance              = 75 + 20 + 20 = 115 → clamped to 100
# -------------------------------------------------------