from pydantic import BaseModel


class SinglePolicySummary(BaseModel):
    overall_rating: str
    adjusted_score: int

    compliance_rating: str
    compliance_score: int

    structural_risk_level: str
    transparency_score: int


class PolicyComparisonReport(BaseModel):
    policy_a: SinglePolicySummary
    policy_b: SinglePolicySummary

    better_policy: str
    score_difference: int
    compliance_difference: int
    transparency_difference: int

    comparison_summary: str
    recommendation: str
