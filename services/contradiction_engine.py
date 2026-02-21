# services/contradiction_engine.py

import re
from schemas.intermediate import ClauseMatchResult


# --------------------------------------------------
# Patterns suggesting condition was NOT pre-existing
# Covers real medical report language
# --------------------------------------------------
_NOT_PREEXISTING_PATTERNS = [
    r"no (prior|previous|past|antecedent) (history|diagnosis|illness|condition|record)",
    r"no (known|documented) (history|condition|disease)",
    r"(first|initial|new|acute|sudden) (onset|occurrence|episode|presentation|diagnosis)",
    r"(patient|claimant).{0,30}(denies|denied).{0,30}(history|prior|previous)",
    r"no evidence.{0,30}(before|prior to).{0,30}(policy|inception|commencement)",
    r"(not|never).{0,20}(diagnosed|treated|hospitalized).{0,30}(before|previously|prior)",
    r"de.?novo",                          # medical Latin for "first occurrence"
    r"(healthy|no illness).{0,30}(before|prior to).{0,20}policy",
]

# --------------------------------------------------
# Patterns suggesting waiting period was already served
# --------------------------------------------------
_WAITING_SERVED_PATTERNS = [
    r"(treatment|hospitali[sz]ation|admission).{0,40}after.{0,20}\d+.{0,10}(year|month)",
    r"waiting period.{0,30}(complete[d]?|elapsed|satisfied|over|expired)",
    r"policy.{0,30}(active|in force).{0,30}(more than|over|beyond|exceeding).{0,20}\d+",
    r"\d+\s*(year|yr)s?.{0,20}(policy|cover|inception)",
    r"(beyond|after|past|post).{0,20}waiting.{0,20}period",
    r"continuous.{0,20}cover.{0,30}\d+.{0,10}year",
    r"(inception|commencement).{0,40}\d+\s*(year|yr)",
]


def _any_match(patterns: list, text: str) -> bool:
    return any(re.search(p, text) for p in patterns)


def detect_preexisting_contradiction(
    clause_result: ClauseMatchResult,
    policy_text: str,
    medical_text: str | None,
) -> ClauseMatchResult:
    """
    Detects contradictions between rejection reason and medical/policy evidence.
    Returns updated ClauseMatchResult via model_copy — never mutates directly.
    """
    if not medical_text:
        return clause_result

    medical_lower = medical_text.lower()
    policy_lower  = (policy_text or "").lower()
    combined      = medical_lower + " " + policy_lower

    updates = {}

    # --------------------------------------------------
    # 1️⃣ Pre-existing disease contradiction
    # --------------------------------------------------
    if clause_result.clause_category == "Pre-existing disease":
        if _any_match(_NOT_PREEXISTING_PATTERNS, medical_lower):
            updates = {
                "rejection_alignment": "Weak",
                "confidence": "Medium",
                "explanation": (
                    "Medical documentation suggests the condition may not have been "
                    "pre-existing before policy inception. "
                    f"Original assessment: {clause_result.explanation}"
                ),
            }

    # --------------------------------------------------
    # 2️⃣ Waiting period contradiction
    # --------------------------------------------------
    elif clause_result.clause_category == "Waiting period":
        if _any_match(_WAITING_SERVED_PATTERNS, combined):
            updates = {
                "rejection_alignment": "Weak",
                "confidence": "Medium",
                "explanation": (
                    "Medical or policy documentation suggests the waiting period "
                    "may have already been satisfied at the time of the claim. "
                    f"Original assessment: {clause_result.explanation}"
                ),
            }

    if updates:
        return clause_result.model_copy(update=updates)

    return clause_result