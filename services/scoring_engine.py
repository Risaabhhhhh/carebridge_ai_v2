def compute_appeal_strength(clause_result, doc_result) -> dict:
    """
    Computes appeal strength score (0-100) from clause alignment and documentation analysis.

    Score interpretation:
        >= 70  → Strong appeal case
        40-69  → Moderate — worth pursuing with clarification
        < 40   → Weak — substantive policy ground, harder to appeal
    """

    score = 50
    reasoning_parts = []

    # --------------------------------------------------
    # 1️⃣ Clause Alignment Impact
    # --------------------------------------------------
    alignment = clause_result.rejection_alignment

    if alignment == "Strong":
        score -= 25
        reasoning_parts.append(
            "Rejection strongly aligns with policy wording — insurer's position is well-grounded."
        )
    elif alignment == "Partial":
        score -= 10
        reasoning_parts.append(
            "Rejection partially aligns with policy wording — some grounds for appeal exist."
        )
    elif alignment == "Weak":
        score += 25
        reasoning_parts.append(
            "Rejection weakly aligns with policy wording — potential misapplication of clause detected."
        )
    elif alignment == "Not Detected":
        # ✅ Strongest appeal case — insurer cannot point to a specific clause
        score += 35
        reasoning_parts.append(
            "No specific policy clause identified to justify rejection — "
            "insurer's position may lack clear contractual basis."
        )

    # --------------------------------------------------
    # 2️⃣ Documentation Impact
    #    High severity = gaps in INSURER's or claimant's docs = grounds for appeal
    # --------------------------------------------------
    doc_severity = doc_result.documentation_gap_severity

    if doc_severity == "High":
        score += 20
        reasoning_parts.append(
            "Significant documentation gaps identified — "
            "insurer may not have sufficient basis for rejection."
        )
    elif doc_severity == "Medium":
        score += 8
        reasoning_parts.append(
            "Moderate documentation gaps — submitting additional records may strengthen appeal."
        )
    else:
        score -= 5   # complete documentation slightly favours insurer's position
        reasoning_parts.append(
            "Documentation appears complete — appeal must focus on clause interpretation."
        )

    # --------------------------------------------------
    # 3️⃣ Medical Ambiguity
    # --------------------------------------------------
    if doc_result.medical_ambiguity_detected:
        score += 10
        reasoning_parts.append(
            "Medical documentation contains ambiguous language — "
            "expert clarification could support the appeal."
        )

    # --------------------------------------------------
    # 4️⃣ Rejection Nature
    # --------------------------------------------------
    rejection_nature = getattr(doc_result, "rejection_nature", None)

    if rejection_nature == "Procedural":
        score += 15
        reasoning_parts.append(
            "Rejection is procedural in nature — "
            "correcting submission errors may resolve the claim."
        )
    elif rejection_nature == "Substantive":
        score -= 12
        reasoning_parts.append(
            "Rejection is substantive under policy terms — "
            "appeal requires strong counter-evidence or clause reinterpretation."
        )
    else:
        reasoning_parts.append(
            "Rejection nature could not be clearly determined."
        )

    # --------------------------------------------------
    # 5️⃣ Confidence Adjustment
    #    Pull score toward neutral (50) rather than flat deduction
    # --------------------------------------------------
    clause_low = clause_result.confidence == "Low"
    doc_low    = getattr(doc_result, "confidence", None) == "Low"

    if clause_low and doc_low:
        # Both low — regress strongly toward 50
        score = round(score * 0.6 + 50 * 0.4)
        reasoning_parts.append(
            "Score moderated toward neutral — low confidence in both clause and documentation analysis."
        )
    elif clause_low or doc_low:
        # One low — gentle regression
        score = round(score * 0.85 + 50 * 0.15)
        reasoning_parts.append(
            "Score slightly moderated — low confidence in partial analysis."
        )

    # --------------------------------------------------
    # 6️⃣ Clamp & Label
    # --------------------------------------------------
    score = max(0, min(100, score))

    if score >= 70:
        label = "Strong"
    elif score >= 40:
        label = "Moderate"
    else:
        label = "Weak"

    return {
        "percentage": score,
        "label": label,
        "reasoning": " ".join(reasoning_parts),
    }