# engines/pre_purchase_engine.py
#
# ══════════════════════════════════════════════════════════════════════════════
# CareBridge AI — Pre-Purchase Analysis Engine
#
# Pipeline:
#   1. Deterministic feature extraction
#   2. LLM clause risk classification (MedGemma 4B-IT)
#   3. Deterministic overrides (correct LLM "Not Found")
#   4. IRDAI compliance evaluation
#   5. Broker / structural risk
#   6. Calibrated per-field scoring
#   7. Rating via config thresholds (Strong ≥72, Moderate 48-71, Weak <48)
#   8. Dynamic buyer checklist (only items relevant to this policy's risks)
# ══════════════════════════════════════════════════════════════════════════════

import json
import re

from services.prepurchase_rule_engine import extract_structured_features
from llm.prepurchase_prompt import prepurchase_risk_prompt
from llm.generation import generate
from services.prepurchase_scoring import compute_policy_score
from services.irdai_compliance_engine import evaluate_irdai_compliance
from services.broker_risk_engine import analyze_broker_risk
from config.prepurchase_scoring_config import SCORING_CONFIG

from schemas.pre_purchase import (
    ClauseRiskAssessment,
    PrePurchaseReport,
    IRDAICompliance,
    PolicyScoreBreakdown,
    BrokerRiskAnalysis,
)

_NOT_FOUND_DEFAULTS: dict[str, str] = {
    "waiting_period":             "Not Found",
    "pre_existing_disease":       "Not Found",
    "room_rent_sublimit":         "Not Found",
    "disease_specific_caps":      "Not Found",
    "co_payment":                 "Not Found",
    "exclusions_clarity":         "Not Found",
    "claim_procedure_complexity": "Not Found",
    "sublimits_and_caps":         "Not Found",
    "restoration_benefit":        "Not Found",
    "transparency_of_terms":      "Not Found",
}

_VALID_VALUES: frozenset[str] = frozenset({
    "High Risk", "Moderate Risk", "Low Risk", "Not Found"
})


def _safe_json_parse(raw: str) -> dict | None:
    if not raw or raw.strip() in ("{}", ""):
        return None
    try:
        result = json.loads(raw.strip())
        if isinstance(result, dict) and len(result) > 0:
            return result
    except Exception:
        pass
    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        try:
            result = json.loads(match.group(0))
            if isinstance(result, dict) and len(result) > 0:
                return result
        except Exception:
            pass
    return None


def _apply_deterministic_overrides(
    clause_risk: ClauseRiskAssessment,
    features: dict,
) -> None:
    """
    Rule-based overrides applied IN PLACE after LLM classification.
    Corrects "Not Found" where keyword/numeric evidence clearly found something.
    Priority: numeric features > LLM inference > "Not Found"
    """

    # Waiting Period
    wait: float = features.get("waiting_period_years", 0)
    if wait >= 3:
        clause_risk.waiting_period = "High Risk"
    elif wait == 2:
        clause_risk.waiting_period = "Moderate Risk"
    elif 0 < wait < 2:
        clause_risk.waiting_period = "Low Risk"
    elif features.get("has_waiting_period") and clause_risk.waiting_period == "Not Found":
        clause_risk.waiting_period = "Moderate Risk"

    # Co-payment
    co_pay: float = features.get("co_payment_percentage", 0)
    if co_pay >= 20:
        clause_risk.co_payment = "High Risk"
    elif 10 <= co_pay < 20:
        clause_risk.co_payment = "Moderate Risk"
    elif 0 < co_pay < 10:
        clause_risk.co_payment = "Low Risk"
    elif features.get("co_payment") and clause_risk.co_payment == "Not Found":
        clause_risk.co_payment = "Moderate Risk"

    # Room Rent Sublimit
    room_pct: float = features.get("room_rent_percent", 0)
    if 0 < room_pct <= 1:
        clause_risk.room_rent_sublimit = "High Risk"
    elif room_pct == 2:
        clause_risk.room_rent_sublimit = "Moderate Risk"
    elif room_pct >= 3:
        clause_risk.room_rent_sublimit = "Low Risk"
    elif features.get("room_rent_cap") and clause_risk.room_rent_sublimit == "Not Found":
        clause_risk.room_rent_sublimit = "Moderate Risk"

    # Pre-existing Disease
    if features.get("mentions_pre_existing") and clause_risk.pre_existing_disease == "Not Found":
        clause_risk.pre_existing_disease = "Moderate Risk"

    # Disease Caps / Sublimits
    if features.get("disease_caps") and clause_risk.disease_specific_caps == "Not Found":
        clause_risk.disease_specific_caps = "Moderate Risk"
    if features.get("disease_caps") and clause_risk.sublimits_and_caps == "Not Found":
        clause_risk.sublimits_and_caps = "Moderate Risk"

    # Restoration Benefit
    if features.get("restoration_benefit") and clause_risk.restoration_benefit == "Not Found":
        clause_risk.restoration_benefit = "Low Risk"

    # Claim Procedure
    if features.get("procedural_conditions") and clause_risk.claim_procedure_complexity == "Not Found":
        clause_risk.claim_procedure_complexity = "Moderate Risk"

    # Exclusions Clarity
    if features.get("consumables_exclusion") and clause_risk.exclusions_clarity == "Not Found":
        clause_risk.exclusions_clarity = "High Risk"

    # Transparency
    signals: int = sum([
        bool(features.get("free_look_period")),
        bool(features.get("grievance_redressal")),
        bool(features.get("ombudsman_reference")),
        bool(features.get("irdai_reference")),
    ])
    if signals >= 3 and clause_risk.transparency_of_terms == "Not Found":
        clause_risk.transparency_of_terms = "Low Risk"
    elif signals >= 1 and clause_risk.transparency_of_terms == "Not Found":
        clause_risk.transparency_of_terms = "Moderate Risk"


def _compute_rating(score: float) -> str:
    strong_t   = float(SCORING_CONFIG.get("rating_strong_threshold",   72))
    moderate_t = float(SCORING_CONFIG.get("rating_moderate_threshold", 48))
    if score >= strong_t:   return "Strong"
    if score >= moderate_t: return "Moderate"
    return "Weak"


def _build_dynamic_checklist(clause_risk: ClauseRiskAssessment) -> list[str]:
    """Buyer checklist personalised to this policy's actual risk profile."""
    items: list[str] = []

    if clause_risk.room_rent_sublimit in ("High Risk", "Moderate Risk", "Not Found"):
        items.append(
            "Ask if room rent is capped — get the exact % of sum insured. "
            "A 1% cap can reduce your entire claim payout by 50% via proportionate deduction."
        )
    if clause_risk.co_payment in ("High Risk", "Moderate Risk", "Not Found"):
        items.append(
            "Confirm co-payment % and which conditions trigger it. "
            "20% co-pay on a ₹5L claim means ₹1L out of pocket."
        )
    if clause_risk.pre_existing_disease in ("High Risk", "Moderate Risk", "Not Found"):
        items.append(
            "Confirm pre-existing disease coverage timeline — "
            "when does the waiting period end and what conditions are covered after it?"
        )
    if clause_risk.waiting_period in ("High Risk", "Not Found"):
        items.append(
            "Clarify exact waiting period for PED and specific illnesses. "
            "4-year waiting periods mean no coverage for chronic conditions until year 5."
        )
    if clause_risk.disease_specific_caps in ("High Risk", "Moderate Risk"):
        items.append(
            "Check disease-specific sublimits — cataract, joint replacement, "
            "hernia, dialysis all have per-event caps in many Indian policies."
        )
    if clause_risk.sublimits_and_caps in ("High Risk", "Moderate Risk"):
        items.append(
            "Verify aggregate sublimits — ICU charges, specialist fees, "
            "diagnostics are commonly capped separately from sum insured."
        )
    if clause_risk.claim_procedure_complexity in ("High Risk", "Not Found"):
        items.append(
            "Confirm intimation timelines — some policies require hospital "
            "notification within 6 hours. Missing this can void a valid claim."
        )
    if clause_risk.exclusions_clarity in ("High Risk", "Not Found"):
        items.append(
            "Request the full exclusions schedule before signing — "
            "brochures omit many exclusions found only in the policy wordings."
        )
    if clause_risk.restoration_benefit in ("Not Found", "High Risk"):
        items.append(
            "Ask whether sum insured is restored after exhaustion in the same year, "
            "and whether it applies to the same illness or only a different one."
        )

    items.append(
        "Check the insurer's claim settlement ratio on IRDAI's annual report "
        "(irdai.gov.in) before purchasing. Below 85% warrants scrutiny."
    )
    items.append(
        "Verify the insurer's network hospital list includes your preferred "
        "hospitals — cashless is only available at empanelled hospitals."
    )
    return items


class PrePurchaseEngine:

    def __init__(self, model, tokenizer):
        self.model     = model
        self.tokenizer = tokenizer

    def run(self, policy_text: str) -> PrePurchaseReport:

        # Clean input
        policy_text = re.sub(r"\s+", " ", policy_text).strip()
        policy_text = policy_text[:1200]

        # 1. Deterministic feature extraction
        features = extract_structured_features(policy_text)
        print(f"🔍 Features: {features}")

        # 2. LLM clause risk classification
        prompt = prepurchase_risk_prompt(policy_text)
        raw_output = generate(
            prompt, self.model, self.tokenizer,
            json_mode=True, max_new_tokens=400,
        )
        if not raw_output or raw_output.strip() in ("{}", ""):
            print("⚠ LLM empty — retrying")
            raw_output = generate(
                prompt, self.model, self.tokenizer,
                json_mode=True, max_new_tokens=400,
            )

        parsed = _safe_json_parse(raw_output)
        if parsed is None:
            print("⚠ JSON parse failed — deterministic fallback only")
        print("RAW LLM OUTPUT:", (raw_output or "EMPTY")[:300])

        # 3. Build ClauseRiskAssessment
        try:
            if parsed is None:
                raise ValueError("LLM output invalid")
            for key in _NOT_FOUND_DEFAULTS:
                val = parsed.get(key, "Not Found")
                parsed[key] = val if val in _VALID_VALUES else "Not Found"
            for key, default in _NOT_FOUND_DEFAULTS.items():
                parsed.setdefault(key, default)
            clause_risk = ClauseRiskAssessment(**parsed)
            print("✅ LLM clause parse OK")
        except Exception as e:
            print(f"⚠ Clause build failed ({e}) — using defaults")
            clause_risk = ClauseRiskAssessment(**_NOT_FOUND_DEFAULTS)

        # 4. Deterministic overrides
        _apply_deterministic_overrides(clause_risk, features)
        classified = sum(1 for v in clause_risk.model_dump().values() if v != "Not Found")
        print(f"✅ Post-override: {classified}/10 clauses classified")

        # 5. Confidence
        detected = [v for v in clause_risk.model_dump().values()
                    if v not in ("Not Found", None, "")]
        confidence = "High" if len(detected) >= 8 else "Medium" if len(detected) >= 5 else "Low"

        # 6. IRDAI Compliance
        raw_compliance = evaluate_irdai_compliance(policy_text)
        if isinstance(raw_compliance, IRDAICompliance):
            irdai_compliance = raw_compliance
            compliance_dict  = raw_compliance.model_dump()
        elif isinstance(raw_compliance, dict):
            compliance_dict  = raw_compliance
            irdai_compliance = IRDAICompliance(
                compliance_flags=raw_compliance.get("compliance_flags", {}),
                compliance_score=raw_compliance.get("compliance_score", 0),
                compliance_rating=raw_compliance.get("compliance_rating", "Unknown"),
            )
        else:
            irdai_compliance = IRDAICompliance(
                compliance_flags={}, compliance_score=0, compliance_rating="Unknown"
            )
            compliance_dict = irdai_compliance.model_dump()

        # 7. Broker / structural risk
        broker_risk_analysis = BrokerRiskAnalysis(
            **analyze_broker_risk(
                clause_risk=clause_risk,
                compliance_data=compliance_dict,
            )
        )

        # 8. Scoring
        score_data = compute_policy_score(clause_risk, compliance_dict) or {}
        score: float = float(score_data.get("adjusted_score", 50))

        # Broker micro-adjustments — small by design, core scoring already
        # captures structural risk via clause weights
        if broker_risk_analysis.structural_risk_level == "High":
            score -= 4
        elif broker_risk_analysis.structural_risk_level == "Elevated":
            score -= 2
        if broker_risk_analysis.transparency_score >= 70:
            score += 2

        floor   = float(SCORING_CONFIG.get("score_floor", 8))
        ceiling = float(SCORING_CONFIG.get("score_ceiling", 92))
        score   = max(floor, min(ceiling, score))

        rating = _compute_rating(score)

        score_breakdown = PolicyScoreBreakdown(
            base_score=score_data.get("base_score", 65),
            adjusted_score=round(score),
            rating=rating,
            risk_index=score_data.get(
                "risk_index", round((100.0 - score) / 100.0, 2)
            ),
        )

        return PrePurchaseReport(
            clause_risk=clause_risk,
            score_breakdown=score_breakdown,
            overall_policy_rating=rating,
            summary=(
                "Hybrid deterministic + LLM + IRDAI compliance + "
                "structural risk assessment completed."
            ),
            checklist_for_buyer=_build_dynamic_checklist(clause_risk),
            confidence=confidence,
            red_flags=score_data.get("red_flags", []),
            positive_flags=score_data.get("positive_flags", []),
            irdai_compliance=irdai_compliance,
            broker_risk_analysis=broker_risk_analysis,
        )