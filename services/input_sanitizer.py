def sanitize_audit_input(request):
    """
    Cleans and validates user input before passing to engine.
    """

    policy_text = (request.policy_text or "").strip()
    rejection_text = (request.rejection_text or "").strip()
    medical_text = (request.medical_documents_text or "").strip()
    user_explanation = (request.user_explanation or "").strip()

    # Basic length normalization (prevent huge dumps)
    MAX_LEN = 8000

    policy_text = policy_text[:MAX_LEN]
    rejection_text = rejection_text[:MAX_LEN]
    medical_text = medical_text[:MAX_LEN]
    user_explanation = user_explanation[:MAX_LEN]

    input_quality = "High"

    if not rejection_text:
        input_quality = "Low"

    if len(policy_text) < 20:
        input_quality = "Medium"

    return {
        "policy_text": policy_text,
        "rejection_text": rejection_text,
        "medical_text": medical_text,
        "user_explanation": user_explanation,
        "input_quality": input_quality
    }
