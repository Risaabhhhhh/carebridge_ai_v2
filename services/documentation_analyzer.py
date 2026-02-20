from schemas.intermediate import DocumentationAnalysisResult
from llm.generation import generate
from llm.prompts import documentation_analysis_prompt
from pydantic import ValidationError
import json


def run_documentation_analysis(
    model,
    tokenizer,
    policy_text,
    rejection_text,
    medical_text=None,
    user_context=None
):

    prompt = documentation_analysis_prompt(
        policy_text,
        rejection_text,
        medical_text,
        user_context
    )

    for attempt in range(2):

        raw_output = generate(
            prompt,
            model,
            tokenizer,
            json_mode=True   # ✅ IMPORTANT
        )

        print("RAW DOC OUTPUT:", raw_output)

        # -----------------------------------
        # 1️⃣ Empty Output Guard
        # -----------------------------------
        if not raw_output or not raw_output.strip():
            continue

        # -----------------------------------
        # 2️⃣ Try Extracting JSON
        # -----------------------------------
        try:
            json_start = raw_output.find("{")
            json_end = raw_output.rfind("}") + 1

            if json_start != -1 and json_end != -1:
                cleaned = raw_output[json_start:json_end]
            else:
                cleaned = raw_output

            result_dict = json.loads(cleaned)

            return DocumentationAnalysisResult(**result_dict)

        except (json.JSONDecodeError, ValidationError):
            continue

    # -----------------------------------
    # 3️⃣ Safe Fallback
    # -----------------------------------
    return DocumentationAnalysisResult(
        missing_documents=[],
        documentation_gap_severity="Low",
        rejection_nature="Substantive",
        medical_ambiguity_detected=False,
        explanation="Unable to confidently interpret documentation analysis.",
        confidence="Low"
    )