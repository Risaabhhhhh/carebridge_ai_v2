SCORING_CONFIG = {

    "base_score": 80,

    "financial_weights": {
        "High Risk": -12,
        "Moderate Risk": -6,
        "Low Risk": 0,
        "Not Found": -2
    },

    "financial_fields": [
        "waiting_period",
        "pre_existing_disease",
        "room_rent_sublimit",
        "co_payment",
        "sublimits_and_caps"
    ],

    "positive_boost": {
        "restoration_benefit": 5,
        "exclusions_clarity": 3,
        "claim_procedure_complexity": 3
    },

    "compliance_max_boost": 25
}
