# services/rule_engine.py

import re
from schemas.intermediate import ClauseMatchResult


# --------------------------------------------------
# Phrase-level patterns per rejection category
# More specific = fewer false positives
# --------------------------------------------------
_REJECTION_PATTERNS = [
    ("Pre-existing disease", [
        r"pre.?existing",
        r"prior condition",
        r"pre.?existing disease",
        r"known condition",
        r"declared condition",
        r"history of",
    ]),
    ("Waiting period", [
        r"waiting period",
        r"waiting period not completed",
        r"initial waiting",
        r"waiting period.*not.*elapsed",
        r"policy.*not.*active.*sufficient",
    ]),
    ("Room rent limit", [
        r"room rent",
        r"room limit",
        r"room rent.*exceed",
        r"accommodation.*limit",
        r"bed charge.*limit",
    ]),
    ("Co-payment", [
        r"co.?pay",
        r"co.?payment",
        r"patient.*share",
        r"your.*contribution",
    ]),
    ("Authorization requirement", [
        r"pre.?authoriz",
        r"prior authoriz",
        r"cashless.*not.*approved",
        r"authoriz.*not.*obtained",
        r"approval.*not.*taken",
    ]),
    ("Insufficient documentation", [
        r"insufficient.*document",
        r"document.*not.*submitted",
        r"missing.*document",
        r"incomplete.*record",
        r"document.*required",
        r"medical.*record.*not.*provid",
    ]),
    ("Policy exclusion", [
        r"cosmetic",
        r"excluded.*procedure",
        r"not covered.*policy",
        r"excluded.*condition",
        r"permanent exclusion",
        r"listed.*exclusion",
    ]),
]


def classify_rejection_rule_based(rejection_text: str | None) -> str | None:
    """
    Returns the best-matching clause category using phrase-level regex,
    or None if no confident match found.
    """
    if not rejection_text:
        return None

    text = rejection_text.lower()

    for category, patterns in _REJECTION_PATTERNS:
        if any(re.search(p, text) for p in patterns):
            return category

    return None


# --------------------------------------------------
# Override Layer — only overrides weak LLM outputs
# --------------------------------------------------
def apply_rule_overrides(clause_result: ClauseMatchResult, rejection_text: str) -> ClauseMatchResult:
    """
    Overrides LLM clause result only when:
    - LLM returned low confidence AND unclear category
    Rule-based match alone is not enough to override a Medium/High LLM result.
    """
    category = classify_rejection_rule_based(rejection_text)

    if not category:
        return clause_result

    # ✅ Only override if BOTH conditions met — don't override good LLM output
    if (
        clause_result.clause_category == "Other / unclear"
        and clause_result.confidence == "Low"
    ):
        return clause_result.model_copy(update={
            "clause_category":    category,
            "clause_detected":    f"Rejection matches '{category}' clause pattern.",
            "clause_clarity":     "Medium",       # rule-based = medium clarity, not High
            "rejection_alignment": "Partial",     # conservative — not forcing "Strong"
            "explanation": (
                f"Rejection reason pattern matches '{category}' category. "
                "Detected via rule-based analysis — manual verification recommended."
            ),
            "confidence": "Medium",              # rule match → Medium, not High
        })

    return clause_result


# --------------------------------------------------
# Waiting Period Override
# --------------------------------------------------

# Patterns suggesting treatment occurred after waiting period completed
_POST_WAITING_PATTERNS = [
    r"after\s+\d+\s+year",           # "after 2 years", "after 3 years"
    r"policy.*complet",               # "policy completion", "policy completed"
    r"waiting.*complet",              # "waiting period completed"
    r"elapse[d]?",                    # "waiting period elapsed"
    r"beyond.*waiting",               # "beyond waiting period"
    r"\d+\s+year[s]?.*policy",        # "3 years of policy"
    r"continuous.*cover",             # "continuous coverage for X years"
    r"inception.*\d+\s+year",         # "from inception, 2 years"
]


def apply_waiting_period_override(
    clause_result: ClauseMatchResult,
    policy_text: str,
    medical_text: str,
) -> ClauseMatchResult:
    """
    If rejection is 'Waiting period' but medical/policy text suggests
    the waiting period was already completed, weaken the alignment.
    """
    if clause_result.clause_category != "Waiting period":
        return clause_result

    policy_lower  = (policy_text  or "").lower()
    medical_lower = (medical_text or "").lower()

    policy_mentions_waiting = "waiting period" in policy_lower

    # Check medical or policy text for evidence waiting period was served
    combined = medical_lower + " " + policy_lower
    post_waiting_evidence = any(
        re.search(p, combined) for p in _POST_WAITING_PATTERNS
    )

    if policy_mentions_waiting and post_waiting_evidence:
        return clause_result.model_copy(update={
            "rejection_alignment": "Weak",
            "explanation": (
                "Medical or policy documentation suggests the waiting period "
                "may have already been completed at time of claim. "
                "Original explanation: " + clause_result.explanation
            ),
            "confidence": "Medium",
        })

    return clause_result