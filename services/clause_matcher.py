from schemas.intermediate import ClauseMatchResult
from llm.generation import generate
from llm.prompts import clause_matching_prompt
from services.rule_engine import classify_rejection_rule_based
import json


def run_clause_matcher(model, tokenizer, policy_text, rejection_text, user_context=None):

    # --------------------------------------------------
    # 1️⃣ RULE-BASED CHECK FIRST (FAST + STRONG)
    # --------------------------------------------------
    category = classify_rejection_rule_based(rejection_text)

    if category:
        return ClauseMatchResult(
            clause_category=category,
            clause_detected="Detected via rule-based keyword match",
            clause_clarity="High",
            rejection_alignment="Strong",
            explanation="Rejection reason directly matches standard policy category.",
            confidence="High"
        )

    # --------------------------------------------------
    # 2️⃣ FALLBACK TO LLM
    # --------------------------------------------------
    prompt = clause_matching_prompt(policy_text, rejection_text, user_context)

    raw_output = generate(prompt, model, tokenizer)

    try:
        return ClauseMatchResult.model_validate_json(raw_output)

    except Exception:
        return ClauseMatchResult(
            clause_category="Other / unclear",
            clause_detected="Unclear",
            clause_clarity="Low",
            rejection_alignment="Partial",
            explanation="Unable to confidently interpret rejection clause.",
            confidence="Low"
        )
