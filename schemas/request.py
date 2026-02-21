from pydantic import BaseModel
from typing import Optional


class PostRejectionRequest(BaseModel):
    policy_text: str
    rejection_text: str
    user_explanation: Optional[str] = None
    medical_documents_text: Optional[str] = None


class PrePurchaseRequest(BaseModel):
    policy_text: str