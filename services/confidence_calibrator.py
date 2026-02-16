def calibrate_confidence(clause_result, doc_result):
    """
    Determines final system confidence based on reasoning path.
    """

    # ----------------------------------
    # Rule-based detection = High
    # ----------------------------------
    if "rule-based" in clause_result.clause_detected.lower():
        return "High"

    # ----------------------------------
    # If both engines low → Low
    # ----------------------------------
    if clause_result.confidence == "Low" and doc_result.confidence == "Low":
        return "Low"

    # ----------------------------------
    # If contradiction override triggered
    # ----------------------------------
    if clause_result.rejection_alignment == "Weak":
        return "Medium"

    # ----------------------------------
    # If clause strong + docs strong
    # ----------------------------------
    if clause_result.confidence == "High" and doc_result.confidence == "High":
        return "High"

    # ----------------------------------
    # Default middle ground
    # ----------------------------------
    return "Medium"
