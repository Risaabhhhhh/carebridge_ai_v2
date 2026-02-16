from schemas.response import FinalReport, AppealStrength


def build_final_report(
    clause_result,
    doc_result,
    appeal_strength_data,
    regulatory_context=None
):

    # ----------------------------------
    # 🔒 CONSISTENCY GUARD LAYER
    # ----------------------------------

    # If clause unclear → alignment cannot logically be Strong
    if clause_result.clause_detected.lower() == "unclear":
        if clause_result.rejection_alignment == "Strong":
            clause_result.rejection_alignment = "Partial"

    # If explanation signals uncertainty → force Low confidence
    if "unable to confidently" in clause_result.explanation.lower():
        clause_result.confidence = "Low"

    # If confidence Low → annotate scoring
    if clause_result.confidence == "Low":
        appeal_strength_data["reasoning"] += " Score adjusted due to low model confidence."

    weak_points = []
    strong_points = []

    # ----------------------------------
    # Clause Alignment Impact
    # ----------------------------------
    if clause_result.rejection_alignment == "Strong":
        weak_points.append("Rejection strongly aligns with policy wording.")
    elif clause_result.rejection_alignment == "Partial":
        weak_points.append("Rejection partially aligns with policy wording.")
    else:
        strong_points.append("Rejection appears weakly aligned with policy wording.")

    # ----------------------------------
    # Documentation Impact
    # ----------------------------------
    if doc_result.documentation_gap_severity == "High":
        weak_points.append("Significant documentation gaps detected.")
    elif doc_result.documentation_gap_severity == "Medium":
        weak_points.append("Moderate documentation gaps detected.")
    else:
        strong_points.append("Minimal documentation gaps detected.")

    # ----------------------------------
    # Medical Ambiguity
    # ----------------------------------
    if doc_result.medical_ambiguity_detected:
        weak_points.append("Medical documentation contains ambiguous language.")
    else:
        strong_points.append("No significant medical ambiguity detected.")

    # ----------------------------------
    # Reapplication Steps
    # ----------------------------------
    reapplication_steps = []

    if doc_result.missing_documents:
        reapplication_steps.extend(
            [f"Provide: {doc}" for doc in doc_result.missing_documents]
        )

    reapplication_steps.append("Request written clarification of applied clause.")
    reapplication_steps.append("Ensure all forms are fully completed and signed.")

    # ----------------------------------
    # Final Structured Report
    # ----------------------------------
    return FinalReport(
        case_summary=(
            "The claim was rejected based on the insurer’s interpretation "
            "of policy provisions and submitted documentation."
        ),
        regulatory_considerations=(
            regulatory_context
            if regulatory_context
            else "No specific regulatory references detected."
        ),
        why_rejected=clause_result.explanation,
        policy_clause_detected=clause_result.clause_detected,
        clause_alignment=clause_result.rejection_alignment,
        weak_points=weak_points,
        strong_points=strong_points,
        reapplication_steps=reapplication_steps,
        appeal_strength=AppealStrength(**appeal_strength_data),
        confidence=clause_result.confidence,
        system_notice=(
            "This report provides an informational interpretation only. "
            "It does not predict claim outcomes or provide legal advice."
        )
    )
