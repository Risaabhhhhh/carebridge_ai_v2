# config/prepurchase_scoring_config.py
#
# ══════════════════════════════════════════════════════════════════════════════
# CareBridge AI — Pre-Purchase Scoring Configuration
# Calibrated against 7 real Indian health insurance policy profiles (2024-25)
#
# DESIGN PHILOSOPHY
# ─────────────────
# Base score = 65 — a policy where all clauses are Low Risk, no compliance.
# Bad clauses subtract. Compliance adds. Low Risk is near-neutral (not a reward)
# except for the 3 highest-impact fields (room rent, co-pay, PED).
#
# BENCHMARK VALIDATION (run tests/test_scoring_calibration.py before changing):
#   HDFC Ergo Optima Secure   → 83   Strong
#   Niva Bupa Reassure        → 80   Strong
#   Star Health Comprehensive → 59   Moderate
#   Care Health Advantage     → 55   Moderate
#   Senior Citizen Plan       → 29   Weak
#   PSU generic policy        →  8   Weak
#   All Fields Not Found      → 57   Moderate
# ══════════════════════════════════════════════════════════════════════════════

SCORING_CONFIG: dict = {

    # Starting baseline — all Low Risk clauses, no compliance detected
    "base_score": 65,

    # 8 clause categories evaluated for financial impact (descending order)
    "financial_fields": [
        "room_rent_sublimit",
        "co_payment",
        "pre_existing_disease",
        "waiting_period",
        "disease_specific_caps",
        "sublimits_and_caps",
        "claim_procedure_complexity",
        "exclusions_clarity",
    ],

    # Per-field weight tables: field → {risk_level → score delta}
    #
    # ROOM RENT SUBLIMIT — most impactful
    #   High (-11): cap ≤1% SI triggers proportionate deduction on the entire bill.
    #   A ₹60k surgery in a ₹10k/day room becomes ₹30k payout.
    #   Low (+2): explicitly no cap is a premium feature.
    #
    # CO-PAYMENT
    #   High (-10): 20%+ co-pay = ₹1L out-of-pocket on a ₹5L claim.
    #   Low (+2): 0% co-pay is explicitly buyer-protective.
    #
    # PRE-EXISTING DISEASE
    #   High (-9): PED excluded = most common claim rejection vector in India.
    #   Low (+2): explicitly covered after wait = genuine benefit.
    #
    # WAITING PERIOD
    #   High (-9): 3-4yr = years of vulnerability for chronic conditions.
    #   Moderate (-3): 2yr = Indian market standard, small drag.
    #   Low (0): neutral — <1yr is good but not exceptional enough to reward.
    #
    # DISEASE CAPS / SUBLIMITS / CLAIM PROCEDURE / EXCLUSIONS
    #   Progressively smaller impact — less direct financial consequence.
    #   Not Found = tiny deduction (uncertainty, not confirmed risk).
    "financial_weights": {
        "room_rent_sublimit": {
            "High Risk":     -11,
            "Moderate Risk":  -4,
            "Low Risk":       +2,
            "Not Found":      -3,
        },
        "co_payment": {
            "High Risk":     -10,
            "Moderate Risk":  -3,
            "Low Risk":       +2,
            "Not Found":      -2,
        },
        "pre_existing_disease": {
            "High Risk":      -9,
            "Moderate Risk":  -3,
            "Low Risk":       +2,
            "Not Found":      -2,
        },
        "waiting_period": {
            "High Risk":      -9,
            "Moderate Risk":  -3,
            "Low Risk":        0,
            "Not Found":      -2,
        },
        "disease_specific_caps": {
            "High Risk":      -7,
            "Moderate Risk":  -2,
            "Low Risk":        0,
            "Not Found":      -1,
        },
        "sublimits_and_caps": {
            "High Risk":      -6,
            "Moderate Risk":  -2,
            "Low Risk":        0,
            "Not Found":      -1,
        },
        "claim_procedure_complexity": {
            "High Risk":      -5,
            "Moderate Risk":  -1,
            "Low Risk":        0,
            "Not Found":      -1,
        },
        "exclusions_clarity": {
            "High Risk":      -4,
            "Moderate Risk":  -1,
            "Low Risk":        0,
            "Not Found":      -1,
        },
    },

    # Secondary indicators — only reward Low Risk, small drag for High Risk
    # restoration_benefit: full reinstatement after exhaustion = meaningful extra cover
    # transparency_of_terms: clear KFD, grievance clause = buyer can challenge bad calls
    "positive_boost": {
        "restoration_benefit":   {"Low Risk": 5,  "High Risk": -1, "Moderate Risk": 0, "Not Found": 0},
        "transparency_of_terms": {"Low Risk": 4,  "High Risk": -1, "Moderate Risk": 0, "Not Found": 0},
    },

    # IRDAI compliance boost — max +12 for full 7/7 flags
    # 7/7 → +12.0,  5/7 → +8.6,  3/7 → +5.1,  1/7 → +1.7
    "compliance_scale":    7,
    "compliance_max_boost": 12,

    # Systemic penalty — triggers at ≥62.5% (5/8) High Risk fields
    # 4/8 High Risk (senior plans) does NOT trigger — bad but not structurally broken
    "majority_high_risk_threshold": 0.625,
    "majority_high_risk_penalty":   -6,

    # Score bounds
    # Floor 8: even the worst policy provides some financial cover
    # Ceiling 92: no Indian policy is genuinely flawless
    "score_floor":   8,
    "score_ceiling": 92,

    # Rating thresholds — Indian market calibrated
    # Strong   ≥ 72: at or above best-practice standard
    # Moderate 48–71: acceptable with known trade-offs
    # Weak     < 48: significant financial exposure at claim time
    "rating_strong_threshold":   72,
    "rating_moderate_threshold": 48,
}