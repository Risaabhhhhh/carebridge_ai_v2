import json
import re

from services.prepurchase_rule_engine import extract_structured_features
from llm.prepurchase_prompt import prepurchase_risk_prompt
from llm.generation import generate
from services.prepurchase_scoring import compute_policy_score
from services.irdai_compliance_engine import evaluate_irdai_compliance
from services.broker_risk_engine import analyze_broker_risk

from schemas.pre_purchase import (
    ClauseRiskAssessment,
    PrePurchaseReport,
    IRDAICompliance,
    PolicyScoreBreakdown,
    BrokerRiskAnalysis,
)

_NOT_FOUND_DEFAULTS = {
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


def _safe_json_parse(raw: str) -> dict | None:
    """Parse JSON safely — accepts partial dicts too."""
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


def _apply_deterministic_overrides(clause_risk: ClauseRiskAssessment, features: dict) -> None:
    """
    Apply rule-based overrides to clause_risk IN PLACE.

    IMPORTANT: These overrides run BEFORE the LLM result is finalised.
    This means even if the LLM returns "Not Found" for a clause that is
    clearly present in the policy text via keyword detection, the
    deterministic engine will correct it.

    Bidirectional: sets both high AND low risk based on detected values.
    """

    # ── Waiting Period ──────────────────────────────────────
    wait = features.get("waiting_period_years", 0)
    if wait >= 4:
        clause_risk.waiting_period = "High Risk"
    elif wait == 3:
        clause_risk.waiting_period = "High Risk"
    elif wait == 2:
        clause_risk.waiting_period = "Moderate Risk"
    elif wait == 1:
        clause_risk.waiting_period = "Low Risk"
    elif features.get("has_waiting_period"):
        # Keyword present but duration not parsed → Moderate as safe default
        if clause_risk.waiting_period == "Not Found":
            clause_risk.waiting_period = "Moderate Risk"

    # ── Co-payment ──────────────────────────────────────────
    co_pay = features.get("co_payment_percentage", 0)
    if co_pay >= 20:
        clause_risk.co_payment = "High Risk"
    elif 10 <= co_pay < 20:
        clause_risk.co_payment = "Moderate Risk"
    elif 0 < co_pay < 10:
        clause_risk.co_payment = "Low Risk"
    elif features.get("co_payment") and clause_risk.co_payment == "Not Found":
        # Keyword present but percentage not parsed
        clause_risk.co_payment = "Moderate Risk"

    # ── Room Rent Sublimit ──────────────────────────────────
    room_pct = features.get("room_rent_percent", 0)
    if 0 < room_pct <= 1:
        clause_risk.room_rent_sublimit = "High Risk"
    elif room_pct == 2:
        clause_risk.room_rent_sublimit = "Moderate Risk"
    elif room_pct >= 3:
        clause_risk.room_rent_sublimit = "Low Risk"
    elif features.get("room_rent_cap") and clause_risk.room_rent_sublimit == "Not Found":
        clause_risk.room_rent_sublimit = "Moderate Risk"

    # ── Pre-existing Disease ────────────────────────────────
    if features.get("mentions_pre_existing") and clause_risk.pre_existing_disease == "Not Found":
        clause_risk.pre_existing_disease = "Moderate Risk"

    # ── Disease Caps / Sublimits ────────────────────────────
    if features.get("disease_caps") and clause_risk.disease_specific_caps == "Not Found":
        clause_risk.disease_specific_caps = "Moderate Risk"
    if features.get("disease_caps") and clause_risk.sublimits_and_caps == "Not Found":
        clause_risk.sublimits_and_caps = "Moderate Risk"

    # ── Restoration Benefit ─────────────────────────────────
    if features.get("restoration_benefit") and clause_risk.restoration_benefit == "Not Found":
        clause_risk.restoration_benefit = "Low Risk"   # present = good = Low Risk

    # ── Claim Procedure Complexity ──────────────────────────
    if features.get("procedural_conditions") and clause_risk.claim_procedure_complexity == "Not Found":
        clause_risk.claim_procedure_complexity = "Moderate Risk"

    # ── Exclusions Clarity ──────────────────────────────────
    if features.get("consumables_exclusion") and clause_risk.exclusions_clarity == "Not Found":
        clause_risk.exclusions_clarity = "High Risk"

    # ── Transparency ────────────────────────────────────────
    # If multiple compliance markers are present, terms are transparent
    compliance_signals = sum([
        features.get("free_look_period", False),
        features.get("grievance_redressal", False),
        features.get("ombudsman_reference", False),
        features.get("irdai_reference", False),
    ])
    if compliance_signals >= 3 and clause_risk.transparency_of_terms == "Not Found":
        clause_risk.transparency_of_terms = "Low Risk"
    elif compliance_signals >= 1 and clause_risk.transparency_of_terms == "Not Found":
        clause_risk.transparency_of_terms = "Moderate Risk"


class PrePurchaseEngine:
    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer

    def run(self, policy_text: str) -> PrePurchaseReport:

        # ─────────────────────────────────────────────────────
        # 🔒 CLEAN INPUT
        # ─────────────────────────────────────────────────────
        policy_text = re.sub(r"\s+", " ", policy_text).strip()
        policy_text = policy_text[:1200]

        # ─────────────────────────────────────────────────────
        # 1️⃣ Deterministic Feature Extraction
        # ─────────────────────────────────────────────────────
        features = extract_structured_features(policy_text)
        print(f"🔍 Features extracted: {features}")

        # ─────────────────────────────────────────────────────
        # 2️⃣ LLM Clause Risk Classification
        # ─────────────────────────────────────────────────────
        prompt = prepurchase_risk_prompt(policy_text)

        raw_output = generate(
            prompt,
            self.model,
            self.tokenizer,
            json_mode=True,
            max_new_tokens=400,
        )

        if not raw_output or raw_output.strip() in ("{}", ""):
            print("⚠ LLM returned empty output — retrying...")
            raw_output = generate(
                prompt,
                self.model,
                self.tokenizer,
                json_mode=True,
                max_new_tokens=400,
            )

        parsed = _safe_json_parse(raw_output)

        if parsed is None:
            print("⚠ JSON parse failed after retry — using deterministic fallback only")

        print("RAW PREPURCHASE LLM OUTPUT:", raw_output[:300] if raw_output else "EMPTY")

        # ─────────────────────────────────────────────────────
        # 3️⃣ Build ClauseRiskAssessment from LLM output
        # ─────────────────────────────────────────────────────
        try:
            if parsed is None:
                raise ValueError("LLM output invalid")

            # Normalise any stray values the LLM may have used
            _VALID = {"High Risk", "Moderate Risk", "Low Risk", "Not Found"}
            for key in _NOT_FOUND_DEFAULTS:
                val = parsed.get(key, "Not Found")
                parsed[key] = val if val in _VALID else "Not Found"

            # Fill any missing keys with defaults
            for key, default in _NOT_FOUND_DEFAULTS.items():
                parsed.setdefault(key, default)

            clause_risk = ClauseRiskAssessment(**parsed)
            print(f"✅ LLM clause parse OK")

        except Exception as e:
            print(f"⚠ Clause build failed ({e}) — using all defaults")
            clause_risk = ClauseRiskAssessment(**_NOT_FOUND_DEFAULTS)

        # ─────────────────────────────────────────────────────
        # 4️⃣ Deterministic Overrides
        # Runs AFTER LLM — corrects "Not Found" where features
        # clearly detected something. Also bidirectionally
        # overrides where keyword evidence is stronger than LLM.
        # ─────────────────────────────────────────────────────
        _apply_deterministic_overrides(clause_risk, features)

        llm_fields = sum(1 for v in clause_risk.model_dump().values() if v != "Not Found")
        print(f"✅ After deterministic overrides: {llm_fields}/10 clauses classified")

        # ─────────────────────────────────────────────────────
        # 5️⃣ Confidence
        # ─────────────────────────────────────────────────────
        detected = [v for v in clause_risk.model_dump().values() if v not in ("Not Found", None, "")]
        confidence = "High" if len(detected) >= 8 else "Medium" if len(detected) >= 5 else "Low"

        # ─────────────────────────────────────────────────────
        # 6️⃣ IRDAI Compliance
        # ─────────────────────────────────────────────────────
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

        # ─────────────────────────────────────────────────────
        # 7️⃣ Broker Risk
        # ─────────────────────────────────────────────────────
        broker_risk_analysis = BrokerRiskAnalysis(
            **analyze_broker_risk(
                clause_risk=clause_risk,
                compliance_data=compliance_dict,
            )
        )

        # ─────────────────────────────────────────────────────
        # 8️⃣ Scoring
        # ─────────────────────────────────────────────────────
        score_data = compute_policy_score(clause_risk, compliance_dict) or {}
        score = float(score_data.get("adjusted_score", 50))

        if broker_risk_analysis.structural_risk_level == "High":
            score -= 10
        elif broker_risk_analysis.structural_risk_level == "Elevated":
            score -= 5

        if broker_risk_analysis.transparency_score >= 70:
            score += 5

        score = max(0.0, min(score, 100.0))
        rating = "Strong" if score >= 80 else "Moderate" if score >= 55 else "Weak"

        score_breakdown = PolicyScoreBreakdown(
            base_score=score_data.get("base_score", score),
            adjusted_score=score,
            rating=rating,
            risk_index=score_data.get("risk_index", score),
        )

        checklist = [
            "Ask about waiting period duration clearly.",
            "Confirm pre-existing disease coverage timeline.",
            "Check if room rent has caps.",
            "Verify disease-specific sublimits.",
            "Confirm co-payment percentage.",
            "Clarify exclusions before purchase.",
            "Verify restoration benefit applicability.",
            "Check claim procedure complexity and deadlines.",
        ]

        return PrePurchaseReport(
            clause_risk=clause_risk,
            score_breakdown=score_breakdown,
            overall_policy_rating=rating,
            summary=(
                "Hybrid deterministic + LLM + IRDAI compliance + "
                "structural risk assessment completed."
            ),
            checklist_for_buyer=checklist,
            confidence=confidence,
            red_flags=score_data.get("red_flags", []),
            positive_flags=score_data.get("positive_flags", []),
            irdai_compliance=irdai_compliance,
            broker_risk_analysis=broker_risk_analysis,
        )