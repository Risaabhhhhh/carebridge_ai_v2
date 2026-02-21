import torch
import re
import json
import threading


def generate(
    prompt: str,
    model,
    tokenizer,
    max_new_tokens: int = 150,
    json_mode: bool = False,
    timeout: int = 300,
):
    if json_mode:
        system_content = (
            "You are a JSON output assistant. "
            "Return ONLY valid JSON. No explanation. No text outside the JSON."
        )
    else:
        system_content = "You are a helpful assistant. Respond clearly and concisely."

    full_prompt = f"{system_content}\n\n{prompt}"

    inputs = tokenizer(
        full_prompt,
        return_tensors="pt",
        truncation=True,
        max_length=1800,
        add_special_tokens=True,
    ).to(model.device)

    input_len = inputs["input_ids"].shape[1]
    print(f"Input tokens: {input_len} | Max new: {max_new_tokens}")

    result_container = {"output": None, "error": None}

    def _run():
        try:
            with torch.no_grad():
                out = model.generate(
                    input_ids=inputs["input_ids"],
                    attention_mask=inputs["attention_mask"],
                    max_new_tokens=max_new_tokens,
                    do_sample=False,
                    repetition_penalty=1.1,
                    use_cache=True,
                    # ✅ KEY FIX: do NOT pass pad_token_id=eos_token_id
                    # MedGemma uses eos as pad — passing it makes model pad immediately
                    # Let the model use its own default stopping criteria
                )
            result_container["output"] = out
        except Exception as e:
            result_container["error"] = e

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    thread.join(timeout=timeout)

    if thread.is_alive():
        print(f"Timed out after {timeout}s")
        return "{}" if json_mode else ""

    if result_container["error"]:
        print("Generation error:", result_container["error"])
        return "{}" if json_mode else ""

    new_tokens = result_container["output"][0][input_len:]
    print(f"New tokens generated: {len(new_tokens)}")
    print(f"First 10 token IDs: {new_tokens[:10].tolist()}")

    decoded = tokenizer.decode(
        new_tokens,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=True,
    ).strip()

    print("MODEL RAW OUTPUT:", repr(decoded[:400]))

    if not decoded:
        print("Empty output after decode")
        return "{}" if json_mode else ""

    if json_mode:
        match = re.search(r"\{[\s\S]*\}", decoded)
        if match:
            candidate = match.group(0)
            expected_keys = [
                "waiting_period", "pre_existing_disease", "room_rent_sublimit",
                "disease_specific_caps", "co_payment", "exclusions_clarity",
                "claim_procedure_complexity", "sublimits_and_caps",
                "restoration_benefit", "transparency_of_terms",
            ]
            if all(k in candidate for k in expected_keys):
                return candidate

        print("JSON incomplete — salvaging fields...")
        return _salvage_json(decoded)

    return decoded


_VALUE_MAP = {
    "high risk": "High Risk", "high": "High Risk",
    "moderate risk": "Moderate Risk", "moderate": "Moderate Risk",
    "medium risk": "Moderate Risk", "medium": "Moderate Risk",
    "low risk": "Low Risk", "low": "Low Risk",
    "not found": "Not Found", "not detected": "Not Found",
    "n/a": "Not Found", "na": "Not Found",
    "none": "Not Found", "unclear": "Not Found",
}


def _salvage_json(text: str) -> str:
    keys = [
        "waiting_period", "pre_existing_disease", "room_rent_sublimit",
        "disease_specific_caps", "co_payment", "exclusions_clarity",
        "claim_procedure_complexity", "sublimits_and_caps",
        "restoration_benefit", "transparency_of_terms",
    ]
    result = {}
    for key in keys:
        match = re.search(rf'"{key}"\s*:\s*"([^"]*)"', text, re.IGNORECASE)
        if match:
            result[key] = _VALUE_MAP.get(match.group(1).strip().lower(), "Not Found")
        else:
            result[key] = "Not Found"
    return json.dumps(result, indent=2)