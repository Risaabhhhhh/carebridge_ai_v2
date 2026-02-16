from pydantic import BaseModel
from typing import List, Literal


class AppealStrength(BaseModel):
    percentage: int
    label: Literal["Strong", "Moderate", "Weak"]
    reasoning: str


class FinalReport(BaseModel):
    case_summary: str
    why_rejected: str
    policy_clause_detected: str
    clause_alignment: Literal["Strong", "Partial", "Weak"]
    regulatory_considerations: str


    weak_points: List[str]
    strong_points: List[str]

    reapplication_steps: List[str]

    appeal_strength: AppealStrength
    confidence: Literal["High", "Medium", "Low"]

    system_notice: str
