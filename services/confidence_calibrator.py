# services/confidence_calibrator.py

from schemas.intermediate import ClauseMatchResult, DocumentationAnalysisResult


def calibrate_confidence(
    clause_result: ClauseMatchResult,
    doc_result:    DocumentationAnalysisResult,
) -> str:
    """
    Determines final system confidence from clause + documentation signals.

    Priority order (highest to lowest):
    1. Both engines Low              → Low
    2. Rule-based detection          → High (fast path, reliable)
    3. High clause + High doc        → High
    4. Contradiction detected        → Medium (alignment changed, but uncertain)
    5. Not Detected alignment        → depends on clause confidence
    6. Mixed signals                 → Medium
    """

    clause_conf = clause_result.confidence
    doc_conf    = doc_result.confidence
    alignment   = clause_result.rejection_alignment

    # --------------------------------------------------
    # 1️⃣ Both low → cannot trust either engine
    # --------------------------------------------------
    if clause_conf == "Low" and doc_conf == "Low":
        return "Low"

    # --------------------------------------------------
    # 2️⃣ Rule-based detection — check clause_category signal
    #    Rule-based sets clause_clarity="Medium" and confidence="Medium"/"High"
    #    Use clause_clarity as the signal since clause_detected string changed
    # --------------------------------------------------
    if (
        clause_result.clause_clarity == "High"
        and clause_conf == "High"
        and "rule-based" in clause_result.explanation.lower()
    ):
        return "High"

    # --------------------------------------------------
    # 3️⃣ Both engines High → strong confidence
    # --------------------------------------------------
    if clause_conf == "High" and doc_conf == "High":
        return "High"

    # --------------------------------------------------
    # 4️⃣ Contradiction override triggered (alignment weakened)
    #    Contradiction evidence exists but interpretation uncertain
    # --------------------------------------------------
    if alignment == "Weak" and "original assessment" in clause_result.explanation.lower():
        return "Medium"

    # --------------------------------------------------
    # 5️⃣ Not Detected alignment
    #    No clause found — confidence depends on clause engine alone
    # --------------------------------------------------
    if alignment == "Not Detected":
        if clause_conf == "High":
            return "Medium"   # High confidence that nothing was found = Medium overall
        return "Low"

    # --------------------------------------------------
    # 6️⃣ One engine Low, other High/Medium → Medium
    # --------------------------------------------------
    if clause_conf == "Low" or doc_conf == "Low":
        return "Medium"

    # --------------------------------------------------
    # 7️⃣ Default — mixed Medium signals
    # --------------------------------------------------
    return "Medium"