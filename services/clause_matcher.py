import json
import re

from schemas.intermediate import ClauseMatchResult
from llm.generation import generate
from llm.prompts import clause_matching_prompt
from services.rule_engine import classify_rejection_rule_based


# Shared defaults for fallback and rule-based results
_CLAUSE_DEFAULTS = {
    "clause_category":    "Other / unclear",
    "clause_detected":    "Unclear",
    "clause_clarity":     "Low",
    "rejection_alignment": "Partial",
    "explanation":        "Unable to confidently interpret rejection clause.",
    "confidence":         "Low",
}


def _safe_json_parse(raw: str) -> dict | None:
    """Try clean parse first, then regex extraction."""
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


def run_clause_matcher(
    model,
    tokenizer,
    policy_text: str,
    rejection_text: str,
    user_context: str | None = None,
) -> ClauseMatchResult:

    # --------------------------------------------------
    # 🔒 INPUT CLEANING
    # --------------------------------------------------
    policy_text    = re.sub(r"\s+", " ", (policy_text or "").strip())[:4000]
    rejection_text = re.sub(r"\s+", " ", (rejection_text or "").strip())[:1500]
    user_context   = re.sub(r"\s+", " ", (user_context or "").strip())[:500]

    # --------------------------------------------------
    # 1️⃣ RULE-BASED CHECK (fast path)
    # --------------------------------------------------
    category = classify_rejection_rule_based(rejection_text)

    if category:
        # ✅ Return meaningful strings downstream steps can use,
        #    not a hardcoded "Detected via rule-based keyword match"
        return ClauseMatchResult(
            clause_category=category,
            clause_detected=f"Policy clause: {category}",
            clause_clarity="High",
            rejection_alignment="Strong",
            explanation=(
                f"Rejection reason matches standard policy clause category: '{category}'. "
                "Detected via rule-based keyword analysis."
            ),
            confidence="High",
        )

    # --------------------------------------------------
    # 2️⃣ LLM CLAUSE MATCHING
    # --------------------------------------------------
    prompt = clause_matching_prompt(policy_text, rejection_text, user_context)

    raw_output = generate(
        prompt, model, tokenizer,
        json_mode=True,
        max_new_tokens=256,   # clause matching needs less tokens than 10-field JSON
    )

    # Retry with proper validation
    parsed = _safe_json_parse(raw_output)
    if parsed is None:
        print("⚠️ Clause matcher first parse failed — retrying...")
        raw_output = generate(
            prompt, model, tokenizer,
            json_mode=True,
            max_new_tokens=256,
        )
        parsed = _safe_json_parse(raw_output)

    print("RAW CLAUSE OUTPUT:", raw_output)

    # --------------------------------------------------
    # 3️⃣ BUILD ClauseMatchResult
    # --------------------------------------------------
    try:
        if parsed is None:
            raise ValueError("JSON parse returned None after retry")

        # Fill missing fields with safe defaults
        for key, default in _CLAUSE_DEFAULTS.items():
            parsed.setdefault(key, default)

        return ClauseMatchResult(**parsed)

    except Exception as e:
        print("⚠️ Clause matcher fallback triggered:", e)
        return ClauseMatchResult(**_CLAUSE_DEFAULTS)