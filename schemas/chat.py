# schemas/chat.py

from pydantic import BaseModel, Field
from typing import Optional


class ReportChatResponse(BaseModel):
    """
    Response schema for both /report-chat (one-shot) and /chat (multi-turn).
    """
    answer:     str                    # main response text shown to user
    session_id: Optional[str] = None   # returned on multi-turn for conversation continuity
    confidence: Optional[str] = None   # "High" | "Medium" | "Low"
    sources:    list[str] = Field(default_factory=list)  # regulatory refs cited, if any