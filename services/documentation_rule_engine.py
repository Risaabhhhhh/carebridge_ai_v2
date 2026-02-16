from schemas.intermediate import DocumentationAnalysisResult


def apply_documentation_overrides(doc_result, rejection_text: str):

    text = (rejection_text or "").lower()

    # --------------------------------
    # Procedural rejection keywords
    # --------------------------------
    if "not submitted" in text or "missing document" in text:
        doc_result.rejection_nature = "Procedural"
        doc_result.documentation_gap_severity = "High"
        doc_result.confidence = "High"

    elif "incomplete form" in text:
        doc_result.rejection_nature = "Procedural"
        doc_result.documentation_gap_severity = "Medium"

    # --------------------------------
    # Substantive rejection keywords
    # --------------------------------
    elif "excluded" in text:
        doc_result.rejection_nature = "Substantive"

    elif "not covered" in text:
        doc_result.rejection_nature = "Substantive"

    # --------------------------------
    # Medical ambiguity detection
    # --------------------------------
    if "unclear diagnosis" in text:
        doc_result.medical_ambiguity_detected = True

    return doc_result
