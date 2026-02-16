from pydantic import BaseModel
from typing import Optional


class ReportChatResponse(BaseModel):
    explanation: str
    appeal_paragraph: Optional[str] = None
