from pydantic import BaseModel
from typing import Literal, List, Dict, Optional

# ----------------------------------
# Type Definitions
# ----------------------------------

RiskLevel = Literal["Safe", "Caution", "High Risk", "Not Found"]
RatingLevel = Literal["Strong", "Moderate", "Weak"]

# ----------------------------------
# Clause Risk Assessment
# ----------------------------------

class ClauseRiskAssessment(BaseModel):
    waiting_period: str
    pre_existing_disease: str
    room_rent_sublimit: str
    disease_specific_caps: str
    co_payment: str
    exclusions_clarity: str
    claim_procedure_complexity: str
    sublimits_and_caps: str
    restoration_benefit: str
    transparency_of_terms: str

# ----------------------------------
# IRDAI Compliance
# ----------------------------------

class IRDAICompliance(BaseModel):
    compliance_flags: Dict[str, bool]
    compliance_score: int
    compliance_rating: str

# ----------------------------------
# Policy Score Breakdown
# ----------------------------------

class PolicyScoreBreakdown(BaseModel):
    base_score: int
    adjusted_score: int
    rating: str
    risk_index: float

class BrokerRiskAnalysis(BaseModel):
    risk_density_index: float
    transparency_score: int
    structural_risk_level: str
    recommendation: str

# ----------------------------------
# Final Pre-Purchase Report
# ----------------------------------

class PrePurchaseReport(BaseModel):
    clause_risk: ClauseRiskAssessment
    score_breakdown: PolicyScoreBreakdown
    overall_policy_rating: str
    summary: str
    checklist_for_buyer: List[str]
    confidence: str
    irdai_compliance: IRDAICompliance
    broker_risk_analysis: BrokerRiskAnalysis


    # ⭐ NEW: Insight Highlights
    red_flags: Optional[List[str]] = []
    positive_flags: Optional[List[str]] = []

