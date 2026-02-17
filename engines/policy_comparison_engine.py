from schemas.policy_comparison import PolicyComparisonReport, SinglePolicySummary


class PolicyComparisonEngine:

    def __init__(self, model, tokenizer):
        from engines.pre_purchase_engine import PrePurchaseEngine
        self.engine = PrePurchaseEngine(model, tokenizer)

    def compare(self, policy_a_text: str, policy_b_text: str):

        report_a = self.engine.run(policy_a_text)
        report_b = self.engine.run(policy_b_text)

        score_diff = report_a.score_breakdown.adjusted_score - report_b.score_breakdown.adjusted_score
        compliance_diff = report_a.irdai_compliance.compliance_score - report_b.irdai_compliance.compliance_score
        transparency_diff = report_a.broker_risk_analysis.transparency_score - report_b.broker_risk_analysis.transparency_score

        if score_diff > 0:
            winner = "Policy A"
        elif score_diff < 0:
            winner = "Policy B"
        else:
            winner = "Tie"

        summary = (
            f"{winner} performs better based on weighted policy strength, "
            f"regulatory compliance, and transparency balance."
        )

        recommendation = (
            "Choose the policy with higher transparency and stronger compliance "
            "unless pricing considerations justify otherwise."
        )

        return PolicyComparisonReport(
            policy_a=SinglePolicySummary(
                overall_rating=report_a.overall_policy_rating,
                adjusted_score=report_a.score_breakdown.adjusted_score,
                compliance_rating=report_a.irdai_compliance.compliance_rating,
                compliance_score=report_a.irdai_compliance.compliance_score,
                structural_risk_level=report_a.broker_risk_analysis.structural_risk_level,
                transparency_score=report_a.broker_risk_analysis.transparency_score
            ),
            policy_b=SinglePolicySummary(
                overall_rating=report_b.overall_policy_rating,
                adjusted_score=report_b.score_breakdown.adjusted_score,
                compliance_rating=report_b.irdai_compliance.compliance_rating,
                compliance_score=report_b.irdai_compliance.compliance_score,
                structural_risk_level=report_b.broker_risk_analysis.structural_risk_level,
                transparency_score=report_b.broker_risk_analysis.transparency_score
            ),
            better_policy=winner,
            score_difference=abs(score_diff),
            compliance_difference=abs(compliance_diff),
            transparency_difference=abs(transparency_diff),
            comparison_summary=summary,
            recommendation=recommendation
        )
