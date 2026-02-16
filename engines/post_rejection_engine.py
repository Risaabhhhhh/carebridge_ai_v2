from services.clause_matcher import run_clause_matcher
from services.documentation_analyzer import run_documentation_analysis
from services.scoring_engine import compute_appeal_strength
from services.report_builder import build_final_report

from rag.hybrid_retriever import HybridRegulatoryRetriever
from schemas.response import FinalReport, AppealStrength

from services.rule_engine import apply_rule_overrides, apply_waiting_period_override
from services.documentation_rule_engine import apply_documentation_overrides
from services.contradiction_engine import detect_preexisting_contradiction
from services.input_sanitizer import sanitize_audit_input
from services.confidence_calibrator import calibrate_confidence


class PostRejectionEngine:
    """
    Full Post-Rejection Pipeline:

    0. Input Sanitization
    1. Clause Matching
    2. Contradiction & Rule Overrides
    3. Documentation Analysis (LLM + overrides)
    4. Regulatory Retrieval (Hybrid RAG)
    5. Deterministic Scoring
    6. Confidence Calibration
    7. Structured Final Report
    """

    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer
        self.regulatory_retriever = HybridRegulatoryRetriever()

    def run(self, request):

        # ----------------------------------
        # STEP 0: Input Sanitization
        # ----------------------------------
        clean_input = sanitize_audit_input(request)

        policy_text = clean_input["policy_text"]
        rejection_text = clean_input["rejection_text"]
        medical_text = clean_input["medical_text"]
        user_explanation = clean_input["user_explanation"]

        # ----------------------------------
        # STEP 1: Clause Matching
        # ----------------------------------
        clause_result = run_clause_matcher(
            self.model,
            self.tokenizer,
            policy_text,
            rejection_text,
            user_explanation
        )

        # ----------------------------------
        # STEP 2: Logical Enhancements
        # ----------------------------------
        clause_result = apply_rule_overrides(
            clause_result,
            rejection_text
        )

        clause_result = detect_preexisting_contradiction(
            clause_result,
            policy_text,
            medical_text
        )

        clause_result = apply_waiting_period_override(
            clause_result,
            policy_text,
            medical_text
        )

        # ----------------------------------
        # STEP 3: Documentation Analysis
        # ----------------------------------
        doc_result = run_documentation_analysis(
            self.model,
            self.tokenizer,
            policy_text,
            rejection_text,
            medical_text,
            user_explanation
        )

        doc_result = apply_documentation_overrides(
            doc_result,
            rejection_text
        )

        # ----------------------------------
        # STEP 4: Regulatory Retrieval
        # ----------------------------------
        try:
            regulatory_context = self.regulatory_retriever.retrieve(
                rejection_text
            )
        except Exception:
            regulatory_context = "Regulatory references could not be retrieved."

        # ----------------------------------
        # STEP 5: Safety Gate
        # ----------------------------------
        if (
            clause_result.confidence == "Low"
            and doc_result.confidence == "Low"
        ):
            return FinalReport(
                case_summary=(
                    "The system could not confidently interpret the claim rejection "
                    "based on the provided documents."
                ),
                why_rejected="Insufficient clarity detected in insurer communication or policy text.",
                policy_clause_detected="Unclear from provided documents",
                clause_alignment="Partial",
                weak_points=[
                    "Low confidence in automated interpretation.",
                    "Policy wording and rejection reasoning may require manual review."
                ],
                strong_points=[],
                reapplication_steps=[
                    "Request insurer to specify the exact policy clause applied.",
                    "Request detailed written clarification of rejection reasoning.",
                    "Consult an insurance advisor for manual review."
                ],
                appeal_strength=AppealStrength(
                    percentage=50,
                    label="Moderate",
                    reasoning="Low confidence in automated interpretation; score defaulted conservatively."
                ),
                regulatory_considerations=regulatory_context,
                confidence="Low",
                system_notice=(
                    "Automated interpretation paused due to low confidence. "
                    "Manual clarification is recommended."
                )
            )

        # ----------------------------------
        # STEP 6: Deterministic Scoring
        # ----------------------------------
        appeal_strength_data = compute_appeal_strength(
            clause_result,
            doc_result
        )

        # ----------------------------------
        # STEP 7: Confidence Calibration
        # ----------------------------------
        final_confidence = calibrate_confidence(
            clause_result,
            doc_result
        )

        clause_result.confidence = final_confidence

        # ----------------------------------
        # STEP 8: Final Report
        # ----------------------------------
        return build_final_report(
            clause_result=clause_result,
            doc_result=doc_result,
            appeal_strength_data=appeal_strength_data,
            regulatory_context=regulatory_context
        )
