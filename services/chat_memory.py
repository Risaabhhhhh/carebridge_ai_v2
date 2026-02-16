import uuid


chat_memory_store = {}


def create_session(report_data: dict):
    session_id = str(uuid.uuid4())

    chat_memory_store[session_id] = {
        "report_data": report_data,
        "history": []
    }

    return session_id


def get_session(session_id: str):
    return chat_memory_store.get(session_id)


def add_message(session_id: str, role: str, content: str):
    if session_id in chat_memory_store:
        chat_memory_store[session_id]["history"].append(
            {"role": role, "content": content}
        )
