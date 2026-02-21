# services/chat_memory.py

import uuid
import time
from typing import Optional

# In-memory store — resets on server restart (acceptable for dev/Kaggle)
_store: dict = {}

# Session TTL — 2 hours, prevents OOM on long-running Kaggle sessions
_SESSION_TTL_SECONDS = 7200


def create_session(report_data: dict) -> str:
    session_id = str(uuid.uuid4())
    _store[session_id] = {
        "report_data": report_data,
        "history":     [],
        "created_at":  time.time(),
        "last_used":   time.time(),
    }
    _evict_expired()
    return session_id


def get_session(session_id: str) -> Optional[dict]:
    session = _store.get(session_id)
    if session is None:
        return None
    # Check expiry
    if time.time() - session["last_used"] > _SESSION_TTL_SECONDS:
        del _store[session_id]
        return None
    session["last_used"] = time.time()
    return session


def add_message(session_id: str, role: str, content: str) -> None:
    session = get_session(session_id)
    if session:
        session["history"].append({"role": role, "content": content})


def get_history(session_id: str, max_turns: int = 6) -> list[dict]:
    """
    Return last N turns of conversation history.
    Each turn is {"role": "user"|"assistant", "content": str}.
    """
    session = get_session(session_id)
    if not session:
        return []
    return session["history"][-(max_turns * 2):]   # *2 — each turn = user + assistant


def get_report_data(session_id: str) -> Optional[dict]:
    session = get_session(session_id)
    return session["report_data"] if session else None


def _evict_expired() -> None:
    """Remove sessions older than TTL — called on each new session creation."""
    now = time.time()
    expired = [
        sid for sid, s in _store.items()
        if now - s["last_used"] > _SESSION_TTL_SECONDS
    ]
    for sid in expired:
        del _store[sid]