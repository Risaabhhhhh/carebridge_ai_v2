# schemas/intermediate.py

from pydantic import BaseModel, Field
from typing import List, Literal


# --------------------------------------------------
# Shared type aliases — import these across all schemas
# instead of redefining Literal["High","Medium","Low"] everywhere
# --------------------------------------------------
ConfidenceLevel  = Literal["High", "Medium", "Low"]
SeverityLevel    = Literal["High", "Medium", "Low"]
AlignmentLevel   = Literal["Strong", "Partial", "Weak", "Not Detected"]
ClarityLevel     = Literal["High", "Medium", "Low"]


# --------------------------------------------------
# Clause Match Result
# --------------------------------------------------

class ClauseMatchResult(BaseModel):
    """Output of clause matching step — LLM + rule-based."""

    clause_category: Literal[
        "Pre-existing disease",
        "Waiting period",
        "Policy exclusion",
        "Room rent limit",
        "Co-payment",
        "Insufficient documentation",
        "Authorization requirement",
        "Not Detected",        # ✅ explicit — no clause could be identified
        "Other / unclear",
    ] = "Other / unclear"

    clause_detected:     str           = "Unclear"
    clause_clarity:      ClarityLevel  = "Low"
    rejection_alignment: AlignmentLevel = "Partial"   # ✅ includes "Not Detected"
    explanation:         str           = "No explanation available."
    confidence:          ConfidenceLevel = "Low"


# --------------------------------------------------
# Documentation Analysis Result
# --------------------------------------------------

class DocumentationAnalysisResult(BaseModel):
    """Output of documentation analysis step — LLM + rule overrides."""

    missing_documents: List[str] = Field(default_factory=list)   # ✅ defaults to []

    documentation_gap_severity: SeverityLevel = "Low"

    rejection_nature: Literal[
        "Procedural",
        "Substantive",
        "Mixed",
        "Not Detected",    # ✅ when nature cannot be determined
    ] = "Not Detected"

    medical_ambiguity_detected: bool = False

    explanation: str = "No explanation available."

    confidence: ConfidenceLevel = "Low"