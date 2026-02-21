from pydantic import BaseModel, Field
from typing import Any, Dict, List, Literal, Optional


# --------------------------------------------------
# Shared Type Aliases
# --------------------------------------------------

RiskLevel = Literal["Low Risk", "Moderate Risk", "High Risk", "Not Found"]
RatingLevel = Literal["Strong", "Moderate", "Weak"]
ConfidenceLevel = Literal["High", "Medium", "Low"]

StructuralRiskLevel = Literal[
    "High", "Elevated", "Moderate", "Balanced", "Insufficient Data"
]
ComplianceRating = Literal["High Compliance", "Moderate Compliance", "Low Compliance"]


# --------------------------------------------------
# Clause Risk Assessment
# --------------------------------------------------

class ClauseRiskAssessment(BaseModel):
    """10-clause risk classification output from LLM + deterministic overrides."""
    waiting_period:             RiskLevel = "Not Found"
    pre_existing_disease:       RiskLevel = "Not Found"
    room_rent_sublimit:         RiskLevel = "Not Found"
    disease_specific_caps:      RiskLevel = "Not Found"
    co_payment:                 RiskLevel = "Not Found"
    exclusions_clarity:         RiskLevel = "Not Found"
    claim_procedure_complexity: RiskLevel = "Not Found"
    sublimits_and_caps:         RiskLevel = "Not Found"
    restoration_benefit:        RiskLevel = "Not Found"
    transparency_of_terms:      RiskLevel = "Not Found"


# --------------------------------------------------
# IRDAI Compliance
# --------------------------------------------------

class IRDAICompliance(BaseModel):
    """Structured IRDAI regulatory compliance report."""
    # Dict[str, Any] — values can be bool or List[str] for violations
    compliance_flags:  Dict[str, Any]
    compliance_score:  float = Field(ge=0.0, le=7.0)   # normalised 0-7 scale
    compliance_rating: ComplianceRating


# --------------------------------------------------
# Policy Score Breakdown
# --------------------------------------------------

class PolicyScoreBreakdown(BaseModel):
    """Final scoring output after all adjustments."""
    base_score:     float
    adjusted_score: float = Field(ge=0.0, le=100.0)
    rating:         RatingLevel
    risk_index:     float = Field(ge=0.0, le=1.0)


# --------------------------------------------------
# Broker / Structural Risk
# --------------------------------------------------

class BrokerRiskAnalysis(BaseModel):
    """Structural risk assessment from clause distribution + compliance."""
    risk_density_index:    float = Field(ge=0.0, le=1.0)
    transparency_score:    float = Field(ge=0.0, le=100.0)
    structural_risk_level: StructuralRiskLevel
    recommendation:        str

    # ✅ New fields from fixed broker engine
    high_risk_count:  int = 0
    not_found_count:  int = 0
    data_sufficient:  bool = True


# --------------------------------------------------
# Final Pre-Purchase Report
# --------------------------------------------------

class PrePurchaseReport(BaseModel):
    """Complete pre-purchase policy analysis report."""
    clause_risk:            ClauseRiskAssessment
    score_breakdown:        PolicyScoreBreakdown
    overall_policy_rating:  RatingLevel
    summary:                str
    checklist_for_buyer:    List[str]
    confidence:             ConfidenceLevel
    irdai_compliance:       IRDAICompliance
    broker_risk_analysis:   BrokerRiskAnalysis

    red_flags:      List[str] = Field(default_factory=list)
    positive_flags: List[str] = Field(default_factory=list)