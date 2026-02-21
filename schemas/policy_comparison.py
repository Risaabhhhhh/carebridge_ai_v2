# schemas/policy_comparison.py

from pydantic import BaseModel, Field
from typing import Literal


class PolicyComparisonReport(BaseModel):
    """
    Flat schema matching the frontend ComparisonReport interface exactly.
    """
    policy_a_rating:    str
    policy_b_rating:    str
    policy_a_score:     float
    policy_b_score:     float
    recommended_policy: Literal["A", "B", "Neither"]
    recommendation:     str
    summary:            str
    key_differences:    list[str] = Field(default_factory=list)
    a_advantages:       list[str] = Field(default_factory=list)
    b_advantages:       list[str] = Field(default_factory=list)
    a_risks:            list[str] = Field(default_factory=list)
    b_risks:            list[str] = Field(default_factory=list)