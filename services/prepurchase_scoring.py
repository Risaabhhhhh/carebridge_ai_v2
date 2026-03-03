# services/prepurchase_scoring.py
#
# ══════════════════════════════════════════════════════════════════════════════
# CareBridge AI — Pre-Purchase Policy Scoring Engine
#
# KEY CHANGES from original:
#   1. Per-field weight tables — room_rent penalises more than exclusions_clarity
#   2. Not Found ≠ High Risk — small uncertainty deduction only
#   3. Positive boost uses per-risk dict, not flat if-Low check
#   4. Base = 65, rating thresholds from config (not hardcoded 80/55)
#   5. Debug line prints exact delta for fast diagnostics
# ══════════════════════════════════════════════════════════════════════════════

from config.prepurchase_scoring_config import SCORING_CONFIG

_FIELD_LABELS: dict[str, str] = {
    "room_rent_sublimit":          "Room Rent Sublimit",
    "co_payment":                  "Co-payment",
    "pre_existing_disease":        "Pre-Existing Disease Coverage",
    "waiting_period":              "Waiting Period",
    "disease_specific_caps":       "Disease-Specific Caps",
    "sublimits_and_caps":          "Sublimits & Caps",
    "claim_procedure_complexity":  "Claim Procedure",
    "exclusions_clarity":          "Exclusions Clarity",
    "restoration_benefit":         "Restoration Benefit",
    "transparency_of_terms":       "Term Transparency",
}


def compute_policy_score(clause_risk, compliance_data: dict) -> dict:
    """
    Compute a 0–100 policy score from clause risk + IRDAI compliance.

    Parameters
    ----------
    clause_risk     : ClauseRiskAssessment (Pydantic model or duck-typed)
    compliance_data : dict with {"compliance_score": int (0–7)}

    Returns
    -------
    dict:
        base_score      float
        adjusted_score  float  — before engine's broker micro-adjustments
        risk_index      float  — (100 - score) / 100
        red_flags       list[str]
        positive_flags  list[str]
        high_risk_count int
    """

    base_score: float = float(SCORING_CONFIG["base_score"])
    score: float      = base_score
    red_flags:      list[str] = []
    positive_flags: list[str] = []
    high_risk_count: int      = 0

    financial_fields:  list[str] = SCORING_CONFIG["financial_fields"]
    financial_weights: dict      = SCORING_CONFIG["financial_weights"]

    # ── 1. Per-field financial impact ─────────────────────────────────────────
    for field_name in financial_fields:
        raw = getattr(clause_risk, field_name, "Not Found")
        field_value: str = raw if isinstance(raw, str) and raw else "Not Found"

        field_weights: dict = financial_weights.get(field_name, {
            "High Risk": -8, "Moderate Risk": -2, "Low Risk": 0, "Not Found": -1,
        })
        delta = float(field_weights.get(field_value, 0))
        score += delta

        label = _FIELD_LABELS.get(field_name, field_name.replace("_", " ").title())

        if field_value == "High Risk":
            high_risk_count += 1
            red_flags.append(f"{label} is High Risk — financial exposure at claim time.")
        elif field_value == "Not Found":
            red_flags.append(f"{label}: clause not detected — verify with insurer.")

    # ── 2. Secondary indicator boost / drag ───────────────────────────────────
    for field_name, risk_deltas in SCORING_CONFIG["positive_boost"].items():
        raw = getattr(clause_risk, field_name, "Not Found")
        field_value: str = raw if isinstance(raw, str) and raw else "Not Found"
        delta = float(risk_deltas.get(field_value, 0))
        score += delta

        label = _FIELD_LABELS.get(field_name, field_name.replace("_", " ").title())
        if field_value == "Low Risk" and delta > 0:
            positive_flags.append(f"{label} is favorable.")

    # ── 3. IRDAI compliance boost ─────────────────────────────────────────────
    compliance_boost: float = 0.0
    if compliance_data is None:
        print("⚠️  compliance_data is None — skipping compliance boost")
    else:
        raw_compliance = compliance_data.get("compliance_score")
        if raw_compliance is None:
            print("⚠️  compliance_score missing from compliance_data")
        else:
            scale     = float(SCORING_CONFIG.get("compliance_scale", 7))
            max_boost = float(SCORING_CONFIG["compliance_max_boost"])
            norm      = max(0.0, min(float(raw_compliance) / scale, 1.0))
            compliance_boost = norm * max_boost
            score += compliance_boost

            if norm >= 0.85:
                positive_flags.append("Strong IRDAI regulatory compliance detected.")
            elif norm >= 0.57:
                positive_flags.append("Partial IRDAI compliance detected.")

    # ── 4. Systemic high-risk penalty ────────────────────────────────────────
    total_fields = len(financial_fields)
    threshold    = float(SCORING_CONFIG.get("majority_high_risk_threshold", 0.625))
    sys_penalty  = float(SCORING_CONFIG.get("majority_high_risk_penalty", -6))

    if total_fields > 0 and (high_risk_count / total_fields) >= threshold:
        score += sys_penalty
        red_flags.append(
            f"Systemic risk: {high_risk_count}/{total_fields} clauses are High Risk — "
            "compounding financial exposure across multiple claim scenarios."
        )

    # ── 5. Clamp ──────────────────────────────────────────────────────────────
    floor   = float(SCORING_CONFIG.get("score_floor", 8))
    ceiling = float(SCORING_CONFIG.get("score_ceiling", 92))
    score   = max(floor, min(ceiling, score))

    # ── 6. Risk index ─────────────────────────────────────────────────────────
    risk_index = round((100.0 - score) / 100.0, 2)

    delta = round(score - base_score, 1)
    print(f"📊 Score: base={base_score:.0f}  delta={'+' if delta>=0 else ''}{delta}  "
          f"compliance=+{compliance_boost:.1f}  hr={high_risk_count}/{total_fields}  final={score:.1f}")

    return {
        "base_score":      base_score,
        "adjusted_score":  score,
        "risk_index":      risk_index,
        "red_flags":       red_flags,
        "positive_flags":  positive_flags,
        "high_risk_count": high_risk_count,
    }