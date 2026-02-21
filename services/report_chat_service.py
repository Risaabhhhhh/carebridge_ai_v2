# services/report_chat_service.py

from llm.generation import generate
from llm.prompts import report_chat_prompt
from schemas.chat import ReportChatResponse
from services.chat_memory import get_session, add_message, get_history, get_report_data

_MAX_HISTORY_TURNS = 6


def run_report_chat(
    model,
    tokenizer,
    user_question: str,
    session_id: str | None = None,
    report_data: dict | None = None,
) -> ReportChatResponse:
    """
    One-shot  (/report-chat): pass report_data + user_question
    Session   (/chat):        pass session_id + user_question
    """

    # Resolve report data and history
    if session_id:
        session = get_session(session_id)
        if not session:
            return ReportChatResponse(
                answer="Session not found or expired. Please start a new chat.",
            )
        report_data = get_report_data(session_id)
        history     = get_history(session_id, max_turns=_MAX_HISTORY_TURNS)
    else:
        if not report_data:
            return ReportChatResponse(answer="No report data provided.")
        history = []

    # Build prompt and generate plain text response
    prompt = report_chat_prompt(report_data, history, user_question)

    raw = generate(
        prompt,
        model,
        tokenizer,
        max_new_tokens=200,
        json_mode=False,
    )

    answer = raw.strip() if raw.strip() else (
        "I wasn't able to generate a response. "
        "Try rephrasing or ask about a specific clause or score."
    )

    # Persist to session if session-based
    if session_id:
        add_message(session_id, "user",      user_question)
        add_message(session_id, "assistant", answer)

    # Extract any regulatory references mentioned in the answer
    sources = _extract_sources(answer)

    return ReportChatResponse(
        answer=answer,
        session_id=session_id,
        sources=sources,
    )


def _extract_sources(text: str) -> list[str]:
    """Pull out any IRDAI/Ombudsman references mentioned in the answer."""
    refs = []
    checks = [
        ("IRDAI",            "IRDAI Protection of Policyholders' Interests Regulations 2017"),
        ("Ombudsman",        "Insurance Ombudsman Rules 2017"),
        ("free look",        "IRDAI Free Look Period Mandate"),
        ("portability",      "IRDAI Portability Regulations"),
        ("grievance",        "IRDAI Grievance Redressal Framework"),
        ("moratorium",       "IRDAI Moratorium Period — 8 Year Rule"),
        ("waiting period",   "IRDAI Waiting Period Regulations"),
        ("pre-existing",     "IRDAI Pre-existing Disease Definition"),
    ]
    lower = text.lower()
    for keyword, label in checks:
        if keyword.lower() in lower and label not in refs:
            refs.append(label)
    return refs[:3]