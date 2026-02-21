# services/documentation_analyzer.py

import json
import re

from schemas.intermediate import DocumentationAnalysisResult
from llm.generation import generate
from llm.prompts import documentation_analysis_prompt


_DOC_DEFAULTS = {
    "missing_documents":          [],
    "documentation_gap_severity": "Low",
    "rejection_nature":           "Not Detected",  # ✅ neutral fallback, not "Substantive"
    "medical_ambiguity_detected": False,
    "explanation":                "Unable to confidently interpret documentation.",
    "confidence":                 "Low",
}


def _safe_json_parse(raw: str) -> dict | None:
    """Try clean parse, then outermost-block extraction."""
    try:
        return json.loads(raw.strip())
    except Exception:
        pass
    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    return None


def run_documentation_analysis(
    model,
    tokenizer,
    policy_text:     str,
    rejection_text:  str,
    medical_text:    str | None = None,
    user_context:    str | None = None,
) -> DocumentationAnalysisResult:

    # --------------------------------------------------
    # 🔒 Input truncation — consistent with clause matcher
    # --------------------------------------------------
    policy_text    = re.sub(r"\s+", " ", (policy_text    or "").strip())[:3000]
    rejection_text = re.sub(r"\s+", " ", (rejection_text or "").strip())[:1000]
    medical_text   = re.sub(r"\s+", " ", (medical_text   or "").strip())[:2000]
    user_context   = re.sub(r"\s+", " ", (user_context   or "").strip())[:400]

    prompt = documentation_analysis_prompt(
        policy_text, rejection_text, medical_text, user_context
    )

    # --------------------------------------------------
    # Two attempts with proper JSON validation
    # --------------------------------------------------
    for attempt in range(2):
        raw_output = generate(
            prompt, model, tokenizer,
            json_mode=True,
            max_new_tokens=384,   # doc analysis needs more tokens than clause matching
        )

        print(f"RAW DOC OUTPUT (attempt {attempt + 1}):", raw_output)

        if not raw_output or not raw_output.strip():
            continue

        parsed = _safe_json_parse(raw_output)
        if parsed is None:
            continue

        # Fill missing keys with safe defaults before Pydantic validation
        for key, default in _DOC_DEFAULTS.items():
            parsed.setdefault(key, default)

        try:
            return DocumentationAnalysisResult(**parsed)
        except Exception as e:
            print(f"⚠️ DocumentationAnalysisResult validation failed (attempt {attempt + 1}):", e)
            continue

    # --------------------------------------------------
    # Safe Fallback
    # --------------------------------------------------
    print("⚠️ Documentation analysis fallback triggered after 2 attempts")
    return DocumentationAnalysisResult(**_DOC_DEFAULTS)