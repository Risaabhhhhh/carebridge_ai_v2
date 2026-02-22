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

# Safe default for all 10 clause fields
_NOT_FOUND_DEFAULTS = {
    "waiting_period": "Not Found",
    "pre_existing_disease": "Not Found",
    "room_rent_sublimit": "Not Found",
    "disease_specific_caps": "Not Found",
    "co_payment": "Not Found",
    "exclusions_clarity": "Not Found",
    "claim_procedure_complexity": "Not Found",
    "sublimits_and_caps": "Not Found",
    "restoration_benefit": "Not Found",
    "transparency_of_terms": "Not Found",
}


def _safe_json_parse(raw: str) -> dict | None:
    """Try to parse JSON from model output. Returns dict or None."""
    try:
        return json.loads(raw.strip())
    except Exception:
        pass
    # fallback: extract first {...} block
    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    return None


class PrePurchaseEngine:
    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer

    def run(self, policy_text: str) -> PrePurchaseReport:

        # =====================================================
        # 🔒 CLEAN INPUT
        # =====================================================
        policy_text = re.sub(r"\s+", " ", policy_text).strip()

        # ✅ Increased from 2500 — need enough text for 10 meaningful clauses
        # 6000 chars ≈ ~1500 tokens, safe within 2048 token context
        policy_text = policy_text[:3000]

        # =====================================================
        # 1️⃣ Deterministic Feature Extraction
        # =====================================================
        features = extract_structured_features(policy_text)

        # =====================================================
        # 2️⃣ LLM Clause Risk Classification
        # =====================================================
        prompt = prepurchase_risk_prompt(policy_text)
        raw_output = generate(
            prompt, self.model, self.tokenizer,
            json_mode=True,
            max_new_tokens=400,
        )

        # Retry once with proper validation (not just startswith check)
        parsed = _safe_json_parse(raw_output)
        if parsed is None:
            print("⚠️ First generation failed JSON parse — retrying...")
            raw_output = generate(
                prompt, self.model, self.tokenizer,
                json_mode=True,
                max_new_tokens=400,
            )
            parsed = _safe_json_parse(raw_output)

        print("RAW PREPURCHASE LLM OUTPUT:", raw_output)

        # =====================================================
        # Build ClauseRiskAssessment
        # =====================================================
        try:
            if parsed is None:
                raise ValueError("JSON parse returned None after retry")

            # Fill missing keys with defaults
            for key, default in _NOT_FOUND_DEFAULTS.items():
                parsed.setdefault(key, default)

            clause_risk = ClauseRiskAssessment(**parsed)

        except Exception as e:
            print("⚠️ ClauseRiskAssessment build failed:", e)
            clause_risk = ClauseRiskAssessment(**_NOT_FOUND_DEFAULTS)

        # =====================================================
        # 3️⃣ Deterministic Overrides (bidirectional)
        # =====================================================
        co_pay = features.get("co_payment_percentage", 0)
        if co_pay >= 20:
            clause_risk.co_payment = "High Risk"
        elif co_pay > 0 and co_pay < 10:
            clause_risk.co_payment = "Low Risk"

        wait_years = features.get("waiting_period_years", 0)
        if wait_years >= 3:
            clause_risk.waiting_period = "High Risk"
        elif wait_years <= 1:
            clause_risk.waiting_period = "Low Risk"

        room_rent = features.get("room_rent_percent", 0)
        if room_rent > 0 and room_rent <= 1:
            clause_risk.room_rent_sublimit = "High Risk"
        elif room_rent >= 2:
            clause_risk.room_rent_sublimit = "Moderate Risk"

        # =====================================================
        # 4️⃣ Confidence
        # =====================================================
        detected = [
            v for v in clause_risk.model_dump().values()
            if v not in ("Not Found", None, "")
        ]
        if len(detected) >= 8:
            confidence = "High"
        elif len(detected) >= 5:
            confidence = "Medium"
        else:
            confidence = "Low"

        # =====================================================
        # 5️⃣ IRDAI Compliance  (normalised to always get a dict)
        # =====================================================
        raw_compliance = evaluate_irdai_compliance(policy_text)

        if isinstance(raw_compliance, IRDAICompliance):
            irdai_compliance = raw_compliance
            compliance_dict = raw_compliance.model_dump()
        elif isinstance(raw_compliance, dict):
            compliance_dict = raw_compliance
            irdai_compliance = IRDAICompliance(
                compliance_flags=raw_compliance.get("compliance_flags")
                                 or raw_compliance.get("flags", {}),
                compliance_score=raw_compliance.get("compliance_score")
                                 or raw_compliance.get("score", 0),
                compliance_rating=raw_compliance.get("compliance_rating")
                                  or raw_compliance.get("rating", "Unknown"),
            )
        else:
            print("⚠️ Unexpected compliance return type:", type(raw_compliance))
            irdai_compliance = IRDAICompliance(
                compliance_flags={}, compliance_score=0, compliance_rating="Unknown"
            )
            compliance_dict = irdai_compliance.model_dump()

        # =====================================================
        # 6️⃣ Broker / Structural Risk
        # =====================================================
        broker_risk_data = analyze_broker_risk(
            clause_risk=clause_risk,
            compliance_data=compliance_dict,
        )
        broker_risk_analysis = BrokerRiskAnalysis(**broker_risk_data)

        # =====================================================
        # 7️⃣ Scoring
        # =====================================================
        score_data = compute_policy_score(clause_risk, compliance_dict)

        # Guard against None return from scoring engine
        if not isinstance(score_data, dict):
            print("⚠️ compute_policy_score returned invalid data")
            score_data = {"base_score": 50, "adjusted_score": 50,
                          "risk_index": 50, "red_flags": [], "positive_flags": []}

        score = float(score_data.get("adjusted_score", 50))

        if broker_risk_analysis.structural_risk_level == "High":
            score -= 10
        elif broker_risk_analysis.structural_risk_level == "Elevated":
            score -= 5

        if broker_risk_analysis.transparency_score >= 70:
            score += 5

        score = max(0.0, min(score, 100.0))

        # =====================================================
        # 8️⃣ Rating & Output
        # =====================================================
        if score >= 80:
            rating = "Strong"
        elif score >= 55:
            rating = "Moderate"
        else:
            rating = "Weak"

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