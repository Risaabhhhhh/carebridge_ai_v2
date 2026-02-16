def compute_appeal_strength(clause_result, doc_result):

    score = 50
    reasoning_parts = []

    # ----------------------------------
    # 1️⃣ Clause Alignment Impact
    # ----------------------------------
    if clause_result.rejection_alignment == "Strong":
        score -= 30
        reasoning_parts.append("Rejection strongly aligned with policy wording.")

    elif clause_result.rejection_alignment == "Partial":
        score -= 15
        reasoning_parts.append("Rejection partially aligned with policy wording.")

    elif clause_result.rejection_alignment == "Weak":
        # 🔥 BOOSTED CONTRADICTION LOGIC
        score += 30
        reasoning_parts.append(
            "Rejection weakly aligned with policy wording — potential contradiction detected."
        )

    # ----------------------------------
    # 2️⃣ Documentation Impact
    # ----------------------------------
    if doc_result.documentation_gap_severity == "High":
        score += 25
        reasoning_parts.append("Significant documentation gaps detected.")

    elif doc_result.documentation_gap_severity == "Medium":
        score += 10
        reasoning_parts.append("Moderate documentation gaps detected.")

    else:
        reasoning_parts.append("Minimal documentation gaps detected.")

    # ----------------------------------
    # 3️⃣ Rejection Nature Impact
    # ----------------------------------
    if doc_result.rejection_nature == "Procedural":
        score += 15
        reasoning_parts.append("Rejection appears procedural in nature.")

    elif doc_result.rejection_nature == "Substantive":
        score -= 10
        reasoning_parts.append("Rejection appears substantive under policy terms.")

    # ----------------------------------
    # 4️⃣ Confidence Adjustment
    # ----------------------------------
    if clause_result.confidence == "Low" or doc_result.confidence == "Low":
        score -= 5
        reasoning_parts.append("Score slightly reduced due to low model confidence.")

    # ----------------------------------
    # 5️⃣ Boundaries
    # ----------------------------------
    score = max(0, min(100, score))

    # ----------------------------------
    # 6️⃣ Label Mapping
    # ----------------------------------
    if score >= 70:
        label = "Strong"
    elif score >= 40:
        label = "Moderate"
    else:
        label = "Weak"

    return {
        "percentage": score,
        "label": label,
        "reasoning": " ".join(reasoning_parts)
    }
