from schemas.intermediate import ClauseMatchResult


def detect_preexisting_contradiction(
    clause_result: ClauseMatchResult,
    policy_text: str,
    medical_text: str | None
) -> ClauseMatchResult:

    if not medical_text:
        return clause_result

    medical_lower = medical_text.lower()
    policy_lower = policy_text.lower()

    # ---------------------------------------
    # 1️⃣ Pre-existing disease contradiction
    # ---------------------------------------
    if clause_result.clause_category == "Pre-existing disease":

        if any(
            phrase in medical_lower
            for phrase in [
                "no prior history",
                "no previous diagnosis",
                "no prior medical history",
                "no prior records",
                "first occurrence",
                "no evidence before policy inception"
            ]
        ):
            clause_result.rejection_alignment = "Weak"
            clause_result.confidence = "Medium"
            clause_result.explanation = (
                "Medical documentation suggests condition may not have been "
                "pre-existing before policy inception."
            )

    # ---------------------------------------
    # 2️⃣ Waiting period contradiction
    # ---------------------------------------
    if clause_result.clause_category == "Waiting period":

        if any(
            phrase in medical_lower
            for phrase in [
                "treatment after 3 years",
                "treatment after waiting period",
                "policy active for more than",
                "policy duration exceeds waiting period"
            ]
        ):
            clause_result.rejection_alignment = "Weak"
            clause_result.confidence = "Medium"
            clause_result.explanation = (
                "Medical timeline suggests waiting period may have been satisfied."
            )

    return clause_result
