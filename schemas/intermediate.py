from pydantic import BaseModel
from typing import List, Literal


Confidence = Literal["High", "Medium", "Low"]


class ClauseMatchResult(BaseModel):
    clause_category: Literal[
        "Pre-existing disease",
        "Waiting period",
        "Policy exclusion",
        "Room rent limit",
        "Co-payment",
        "Insufficient documentation",
        "Authorization requirement",
        "Other / unclear"
    ]

    clause_detected: str  # exact quoted text from policy
    clause_clarity: Literal["High", "Medium", "Low"]
    rejection_alignment: Literal["Strong", "Partial", "Weak"]

    explanation: str
    confidence: Confidence



class DocumentationAnalysisResult(BaseModel):
    missing_documents: List[str]

    documentation_gap_severity: Literal["High", "Medium", "Low"]

    rejection_nature: Literal[
        "Procedural",
        "Substantive",
        "Mixed"
    ]

    medical_ambiguity_detected: bool

    explanation: str

    confidence: Confidence
