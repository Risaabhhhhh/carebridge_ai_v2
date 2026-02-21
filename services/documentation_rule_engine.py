# services/documentation_rule_engine.py

import re
from schemas.intermediate import DocumentationAnalysisResult


def apply_documentation_overrides(
    doc_result: DocumentationAnalysisResult,
    rejection_text: str,
) -> DocumentationAnalysisResult:
    """
    Applies rule-based overrides to documentation analysis result.
    Uses model_copy — never mutates Pydantic model directly.
    """

    text = (rejection_text or "").lower()
    updates = {}

    # --------------------------------------------------
    # Procedural rejection detection
    # --------------------------------------------------
    if re.search(r"document[s]?.{0,20}not submitted|missing document|not.*provid", text):
        updates["rejection_nature"]           = "Procedural"
        updates["documentation_gap_severity"] = "High"
        updates["confidence"]                 = "High"

    elif re.search(r"incomplete.{0,20}form|form.{0,20}incomplete|unsigned|not signed", text):
        updates["rejection_nature"]           = "Procedural"
        updates["documentation_gap_severity"] = "Medium"

    # --------------------------------------------------
    # Substantive rejection detection
    # --------------------------------------------------
    elif re.search(r"excluded.{0,30}(condition|procedure|treatment)|not covered", text):
        updates["rejection_nature"] = "Substantive"

    elif re.search(r"policy.{0,20}does not cover|outside.{0,20}coverage", text):
        updates["rejection_nature"] = "Substantive"

    # --------------------------------------------------
    # Medical ambiguity detection
    # --------------------------------------------------
    if re.search(r"unclear.{0,20}(diagnosis|condition)|ambiguous.{0,20}(report|record|finding)", text):
        updates["medical_ambiguity_detected"] = True

    if updates:
        return doc_result.model_copy(update=updates)

    return doc_result