# schemas/response.py

from pydantic import BaseModel, Field
from typing import List, Literal, Optional


# --------------------------------------------------
# Shared literals — import these in pre_purchase.py too
# to avoid redefinition across schemas
# --------------------------------------------------
ConfidenceLevel  = Literal["High", "Medium", "Low"]
RatingLevel      = Literal["Strong", "Moderate", "Weak"]
AlignmentLevel   = Literal["Strong", "Partial", "Weak", "Not Detected"]


# --------------------------------------------------
# Appeal Strength
# --------------------------------------------------

class AppealStrength(BaseModel):
    percentage: int = Field(ge=0, le=100)   # ✅ bounded
    label:      RatingLevel
    reasoning:  str


# --------------------------------------------------
# Final Post-Rejection Report
# --------------------------------------------------

class FinalReport(BaseModel):
    """Complete post-rejection analysis and appeal guidance report."""

    # Core analysis
    case_summary:            str
    why_rejected:            str
    policy_clause_detected:  str
    clause_alignment:        AlignmentLevel   # ✅ includes "Not Detected"

    # Consumer guidance
    weak_points:          List[str] = Field(default_factory=list)
    strong_points:        List[str] = Field(default_factory=list)
    reapplication_steps:  List[str] = Field(default_factory=list)

    # ✅ Explicit reapplication flag — frontend shouldn't infer from percentage
    reapplication_possible: bool = True

    # Regulatory & scoring
    regulatory_considerations: str = ""
    appeal_strength:           AppealStrength

    # Confidence & notices
    confidence:    ConfidenceLevel
    system_notice: str = ""   # ✅ defaults to empty — only set on degraded/fallback reports