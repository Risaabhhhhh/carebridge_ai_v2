from llm.generation import generate
from llm.prompts import report_chat_prompt
from schemas.chat import ReportChatResponse
from services.chat_memory import get_session, add_message
from pydantic import ValidationError


def run_report_chat(model, tokenizer, session_id: str, user_question: str):

    session = get_session(session_id)

    if not session:
        raise Exception("Invalid session ID.")

    report_data = session["report_data"]
    history = session["history"]

    prompt = report_chat_prompt(report_data, history, user_question)

    for attempt in range(2):
        raw_output = generate(prompt, model, tokenizer, max_new_tokens=300)

        try:
            result = ReportChatResponse.model_validate_json(raw_output)

            # Store conversation
            add_message(session_id, "user", user_question)
            add_message(session_id, "assistant", result.model_dump())

            return result

        except ValidationError:
            if attempt == 1:
                raise

    raise Exception("Chat failed after retries.")
