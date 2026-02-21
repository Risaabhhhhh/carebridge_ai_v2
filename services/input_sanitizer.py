# services/input_sanitizer.py

import re


# Per-field limits matching what downstream services truncate to
# Setting these here avoids double-truncation inconsistencies
_FIELD_LIMITS = {
    "policy_text":     6000,   # matches documentation_analyzer
    "rejection_text":  1500,   # matches clause_matcher
    "medical_text":    2000,   # matches documentation_analyzer
    "user_explanation": 500,   # free-text field — keep tight
}


def _clean(text: str, max_len: int) -> str:
    """Strip, collapse whitespace, truncate."""
    text = (text or "").strip()
    text = re.sub(r"\s+", " ", text)   # collapse OCR noise, newlines, tabs
    return text[:max_len]


def sanitize_audit_input(request) -> dict:
    """
    Cleans and validates post-rejection engine inputs.
    Returns normalized dict with input_quality signal.
    """

    policy_text      = _clean(getattr(request, "policy_text",             ""), _FIELD_LIMITS["policy_text"])
    rejection_text   = _clean(getattr(request, "rejection_text",          ""), _FIELD_LIMITS["rejection_text"])
    medical_text     = _clean(getattr(request, "medical_documents_text",  ""), _FIELD_LIMITS["medical_text"])
    user_explanation = _clean(getattr(request, "user_explanation",        ""), _FIELD_LIMITS["user_explanation"])

    # --------------------------------------------------
    # Input Quality Assessment (priority order matters)
    # --------------------------------------------------
    if not rejection_text:
        input_quality = "Low"
        print("⚠️ Input quality Low: rejection_text is empty — engine cannot proceed reliably")

    elif len(policy_text) < 50:
        input_quality = "Low"
        print(f"⚠️ Input quality Low: policy_text too short ({len(policy_text)} chars)")

    elif len(policy_text) < 200 or len(rejection_text) < 30:
        input_quality = "Medium"
        print(
            f"⚠️ Input quality Medium: "
            f"policy_text={len(policy_text)} chars, "
            f"rejection_text={len(rejection_text)} chars"
        )

    else:
        input_quality = "High"

    return {
        "policy_text":      policy_text,
        "rejection_text":   rejection_text,
        "medical_text":     medical_text,
        "user_explanation": user_explanation,
        "input_quality":    input_quality,
    }