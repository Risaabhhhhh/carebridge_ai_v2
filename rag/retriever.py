from pathlib import Path

def load_regulatory_text():
    base_path = Path("rag/regulatory_docs")
    content = ""
    for file in base_path.glob("*.txt"):
        content += file.read_text() + "\n"
    return content

REGULATORY_CONTEXT = load_regulatory_text()


def retrieve_relevant_regulation(user_text: str):
    # Simple keyword retrieval for now
    keywords = ["waiting period", "documentation", "rejection", "grievance", "ombudsman"]

    matched_sections = []

    for line in REGULATORY_CONTEXT.split("\n"):
        if any(k.lower() in line.lower() for k in keywords):
            matched_sections.append(line)

    return "\n".join(matched_sections[:5])
