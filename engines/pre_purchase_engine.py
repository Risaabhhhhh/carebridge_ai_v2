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
    BrokerRiskAnalysis
)


class PrePurchaseEngine:
    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer

    def run(self, policy_text: str):

        # ----------------------------------
        # 1️⃣ Deterministic Feature Extraction
        # ----------------------------------
        features = extract_structured_features(policy_text)

        # ----------------------------------
        # 2️⃣ LLM Clause Risk Classification
        # ----------------------------------
        prompt = prepurchase_risk_prompt(policy_text)

        raw_output = generate(
            prompt,
            self.model,
            self.tokenizer,
            json_mode=True   # ✅ IMPORTANT FIX
        )

        print("RAW PREPURCHASE LLM OUTPUT:", raw_output)

        try:
            json_match = re.search(r"\{[\s\S]*\}", raw_output)

            if not json_match:
                raise ValueError("No JSON found")

            risk_data = json.loads(json_match.group(0))
            clause_risk = ClauseRiskAssessment(**risk_data)

        except Exception as e:
            print("⚠️ JSON PARSE FAILED:", e)

            clause_risk = ClauseRiskAssessment(
                waiting_period="Not Found",
                pre_existing_disease="Not Found",
                room_rent_sublimit="Not Found",
                disease_specific_caps="Not Found",
                co_payment="Not Found",
                exclusions_clarity="Not Found",
                claim_procedure_complexity="Not Found",
                sublimits_and_caps="Not Found",
                restoration_benefit="Not Found",
                transparency_of_terms="Not Found"
            )

        # ----------------------------------
        # 3️⃣ Deterministic Risk Overrides
        # ----------------------------------
        if features.get("co_payment_percentage", 0) >= 20:
            clause_risk.co_payment = "High Risk"

        if features.get("waiting_period_years", 0) >= 3:
            clause_risk.waiting_period = "High Risk"

        if features.get("room_rent_percent", 0) <= 1:
            clause_risk.room_rent_sublimit = "High Risk"

        # ----------------------------------
        # 4️⃣ Confidence Calibration
        # ----------------------------------
        risk_values = clause_risk.model_dump().values()
        non_not_found = sum(1 for v in risk_values if v != "Not Found")

        if non_not_found >= 6:
            confidence = "High"
        elif non_not_found >= 3:
            confidence = "Medium"
        else:
            confidence = "Low"

        # ----------------------------------
        # 5️⃣ IRDAI Compliance Evaluation
        # ----------------------------------
        compliance_data = evaluate_irdai_compliance(policy_text)

        if isinstance(compliance_data, IRDAICompliance):
            irdai_compliance = compliance_data
            compliance_dict = compliance_data.model_dump()
        else:
            irdai_compliance = IRDAICompliance(
                compliance_flags=compliance_data.get("flags", {}),
                compliance_score=compliance_data.get("score", 0),
                compliance_rating=compliance_data.get("rating", "Unknown")
            )
            compliance_dict = compliance_data

        # ----------------------------------
        # 6️⃣ Broker Structural Risk Analysis
        # ----------------------------------
        broker_risk_data = analyze_broker_risk(
            clause_risk=clause_risk,
            compliance_data=compliance_dict
        )

        broker_risk_analysis = BrokerRiskAnalysis(**broker_risk_data)

        # ----------------------------------
        # 7️⃣ Base Scoring
        # ----------------------------------
        score_data = compute_policy_score(
            clause_risk,
            compliance_dict
        )

        score = score_data["adjusted_score"]

        # ----------------------------------
        # 8️⃣ Structural Risk Weighting
        # ----------------------------------
        if broker_risk_analysis.structural_risk_level == "High":
            score -= 10
        elif broker_risk_analysis.structural_risk_level == "Elevated":
            score -= 5

        if broker_risk_analysis.transparency_score >= 70:
            score += 5

        score = max(0, min(score, 100))

        # ----------------------------------
        # 9️⃣ Final Rating
        # ----------------------------------
        if score >= 80:
            rating = "Strong"
        elif score >= 55:
            rating = "Moderate"
        else:
            rating = "Weak"

        # ----------------------------------
        # 🔟 Score Breakdown
        # ----------------------------------
        score_breakdown = PolicyScoreBreakdown(
            base_score=score_data["base_score"],
            adjusted_score=score,
            rating=rating,
            risk_index=score_data.get("risk_index", score)
        )

        # ----------------------------------
        # 1️⃣1️⃣ Buyer Checklist
        # ----------------------------------
        checklist = [
            "Ask about waiting period duration clearly.",
            "Confirm pre-existing disease coverage timeline.",
            "Check if room rent has caps.",
            "Verify disease-specific sublimits.",
            "Confirm co-payment percentage.",
            "Clarify exclusions before purchase."
        ]

        # ----------------------------------
        # 1️⃣2️⃣ Final Report
        # ----------------------------------
        return PrePurchaseReport(
            clause_risk=clause_risk,
            score_breakdown=score_breakdown,
            overall_policy_rating=rating,
            summary="Hybrid deterministic + LLM + IRDAI compliance + structural risk assessment completed.",
            checklist_for_buyer=checklist,
            confidence=confidence,
            red_flags=score_data.get("red_flags", []),
            positive_flags=score_data.get("positive_flags", []),
            irdai_compliance=irdai_compliance,
            broker_risk_analysis=broker_risk_analysis
        )