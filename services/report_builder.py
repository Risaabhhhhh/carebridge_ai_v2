from schemas.response import FinalReport, AppealStrength


def build_final_report(
    clause_result,
    doc_result,
    appeal_strength_data: dict,
    regulatory_context: str = "",
) -> FinalReport:

    # --------------------------------------------------
    # 🔒 CONSISTENCY GUARD  (Pydantic v2 safe mutation)
    # --------------------------------------------------
    clause_updates = {}

    if clause_result.clause_detected.lower() == "unclear":
        if clause_result.rejection_alignment == "Strong":
            clause_updates["rejection_alignment"] = "Partial"

    if "unable to confidently" in clause_result.explanation.lower():
        clause_updates["confidence"] = "Low"

    if clause_updates:
        clause_result = clause_result.model_copy(update=clause_updates)

    # Annotate reasoning for low confidence — don't mutate dict in place
    reasoning = appeal_strength_data.get("reasoning", "")
    if clause_result.confidence == "Low":
        reasoning = reasoning.rstrip() + " Score adjusted due to low model confidence."

    # --------------------------------------------------
    # Weak / Strong Points
    # --------------------------------------------------
    weak_points   = []
    strong_points = []

    alignment = clause_result.rejection_alignment

    if alignment == "Strong":
        weak_points.append("Rejection strongly aligns with policy wording.")
    elif alignment == "Partial":
        weak_points.append("Rejection partially aligns with policy wording.")
    elif alignment == "Not Detected":
        strong_points.append(
            "No clear policy clause could be identified to justify the rejection."
        )
    else:  # "Weak"
        strong_points.append("Rejection appears weakly aligned with policy wording.")

    if doc_result.documentation_gap_severity == "High":
        weak_points.append("Significant documentation gaps detected.")
    elif doc_result.documentation_gap_severity == "Medium":
        weak_points.append("Moderate documentation gaps detected.")
    else:
        strong_points.append("Minimal documentation gaps detected.")

    if doc_result.medical_ambiguity_detected:
        weak_points.append("Medical documentation contains ambiguous language.")
    else:
        strong_points.append("No significant medical ambiguity detected.")

    # --------------------------------------------------
    # Reapplication Steps
    # --------------------------------------------------
    reapplication_steps = []

    if doc_result.missing_documents:
        reapplication_steps.extend(
            [f"Provide missing document: {doc}" for doc in doc_result.missing_documents]
        )

    reapplication_steps.append(
        "Request written clarification of the exact policy clause applied for rejection."
    )
    reapplication_steps.append(
        "Ensure all claim forms are fully completed, signed, and resubmitted."
    )

    if alignment in ("Weak", "Not Detected"):
        reapplication_steps.append(
            "Consider filing a formal grievance — rejection clause is unclear or weakly justified."
        )

    # --------------------------------------------------
    # Reapplication Possible Flag
    # --------------------------------------------------
    appeal_pct = appeal_strength_data.get("percentage", 50)
    appeal_label = appeal_strength_data.get("label", "Moderate")
    reapplication_possible = not (appeal_label == "Weak" and appeal_pct < 35)

    # --------------------------------------------------
    # Dynamic Case Summary
    # --------------------------------------------------
    category = getattr(clause_result, "clause_category", "an unspecified clause")
    confidence = clause_result.confidence

    if confidence == "High":
        case_summary = (
            f"The claim was rejected under the '{category}' clause. "
            "The rejection reason has been identified with high confidence."
        )
    elif confidence == "Medium":
        case_summary = (
            f"The claim appears to have been rejected under the '{category}' clause. "
            "Moderate confidence — manual review of policy wording is recommended."
        )
    else:
        case_summary = (
            "The basis for rejection could not be confidently identified. "
            "The insurer's reasoning may require further written clarification."
        )

    # --------------------------------------------------
    # System Notice — only for non-standard confidence
    # --------------------------------------------------
    system_notice = ""
    if confidence == "Low":
        system_notice = (
            "Low confidence in automated interpretation. "
            "Manual review or insurer clarification is strongly recommended."
        )

    # --------------------------------------------------
    # Final Report
    # --------------------------------------------------
    return FinalReport(
        case_summary=case_summary,
        why_rejected=clause_result.explanation,
        policy_clause_detected=clause_result.clause_detected,
        clause_alignment=alignment,
        weak_points=weak_points,
        strong_points=strong_points,
        reapplication_steps=reapplication_steps,
        reapplication_possible=reapplication_possible,
        regulatory_considerations=(
            regulatory_context or "No specific regulatory references detected."
        ),
        appeal_strength=AppealStrength(
            percentage=appeal_pct,
            label=appeal_label,
            reasoning=reasoning,
        ),
        confidence=confidence,
        system_notice=system_notice,
    )