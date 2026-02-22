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
    temperature: float = 0.0,
):
    """
    Robust generator for MedGemma 4B-IT.
    """

    # --------------------------------------------------
    # Resolve token IDs safely
    # --------------------------------------------------
    eos_id = tokenizer.eos_token_id
    eos_id = eos_id[0] if isinstance(eos_id, list) else eos_id
    eos_id = eos_id if eos_id is not None else 1

    # 🔥 Gemma requires pad == eos
    pad_id = tokenizer.pad_token_id
    if pad_id is None or pad_id != eos_id:
        pad_id = eos_id

    tokenizer.padding_side = "left"

    # --------------------------------------------------
    # Messages
    # --------------------------------------------------
    if json_mode:
        system_msg = (
            "Return ONLY a valid JSON object. "
            "No explanation. No markdown. No text before or after JSON."
        )
    else:
        system_msg = "Give clear and direct answers."

    messages = [
        {"role": "user", "content": f"{system_msg}\n\n{prompt}"},
    ]

    input_ids = None
    attention_mask = None

    # --------------------------------------------------
    # apply_chat_template (preferred)
    # --------------------------------------------------
    try:
        chat_result = tokenizer.apply_chat_template(
            messages,
            return_tensors="pt",
            add_generation_prompt=True,
            truncation=True,
            max_length=2800,
        )

        if isinstance(chat_result, torch.Tensor):
            input_ids = chat_result.to(model.device)
        else:
            input_ids = chat_result["input_ids"].to(model.device)

        attention_mask = torch.ones_like(input_ids)

        print(f"✅ apply_chat_template OK — {input_ids.shape[1]} tokens")

    except Exception as e:
        print(f"⚠ apply_chat_template failed ({e})")
        input_ids = None

    # --------------------------------------------------
    # Manual Gemma fallback
    # --------------------------------------------------
    if input_ids is None:
        bos = tokenizer.bos_token or "<bos>"
        gemma_prompt = (
            f"{bos}<start_of_turn>user\n"
            f"{system_msg}\n\n{prompt}"
            f"<end_of_turn>\n"
            f"<start_of_turn>model\n"
        )

        try:
            inputs = tokenizer(
                gemma_prompt,
                return_tensors="pt",
                truncation=True,
                max_length=2800,
                add_special_tokens=False,
            ).to(model.device)

            input_ids = inputs["input_ids"]
            attention_mask = inputs["attention_mask"]

            print(f"✅ Gemma fallback OK — {input_ids.shape[1]} tokens")

        except Exception as e:
            print(f"❌ fallback failed ({e})")
            return "{}" if json_mode else ""

    input_len = input_ids.shape[1]
    print(f"Input tokens: {input_len} | Max new: {max_new_tokens}")

    result_container = {"output": None, "error": None}

    # --------------------------------------------------
    # Generation thread
    # --------------------------------------------------
    def _run():
        try:
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

            with torch.no_grad():
                output = model.generate(
                    input_ids=input_ids,
                    attention_mask=attention_mask,

                    max_new_tokens=max_new_tokens,
                    min_new_tokens=10,

                    # deterministic = safer for structured output
                    do_sample=False,

                    repetition_penalty=1.1,
                    use_cache=True,

                    eos_token_id=eos_id,
                    pad_token_id=pad_id,
                )

            result_container["output"] = output

        except Exception as e:
            result_container["error"] = e

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    thread.join(timeout)

    if thread.is_alive():
        print(f"⚠ Generation timed out")
        return "{}" if json_mode else ""

    if result_container["error"]:
        print("❌ Generation error:", result_container["error"])
        return "{}" if json_mode else ""

    if result_container["output"] is None:
        return "{}" if json_mode else ""

    # --------------------------------------------------
    # Decode
    # --------------------------------------------------
    new_tokens = result_container["output"][0][input_len:]
    print(f"New tokens generated: {len(new_tokens)}")

    decoded = tokenizer.decode(
        new_tokens,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=True,
    ).strip()

    if not decoded:
        decoded_raw = tokenizer.decode(new_tokens, skip_special_tokens=False)
        decoded = re.sub(r"<[^>]+>", "", decoded_raw).strip()

        if not decoded:
            return "{}" if json_mode else ""

    print("MODEL RAW OUTPUT:", repr(decoded[:300]))

    if json_mode:
        return _extract_json(decoded)

    return decoded


# --------------------------------------------------
# JSON EXTRACTION
# --------------------------------------------------

def _extract_json(text: str) -> str:
    try:
        parsed = json.loads(text.strip())
        if isinstance(parsed, dict):
            return json.dumps(parsed)
    except:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.dumps(json.loads(match.group(0)))
        except:
            pass

    return _salvage_json(text)


# --------------------------------------------------
# VALUE NORMALIZATION
# --------------------------------------------------

_VALUE_MAP = {
    "high risk": "High Risk",
    "moderate risk": "Moderate Risk",
    "medium risk": "Moderate Risk",
    "low risk": "Low Risk",
    "not found": "Not Found",
}


def _normalize(value: str):
    v = value.lower().strip()
    if v in _VALUE_MAP:
        return _VALUE_MAP[v]
    if "high" in v:
        return "High Risk"
    if "moderate" in v or "medium" in v:
        return "Moderate Risk"
    if "low" in v:
        return "Low Risk"
    return "Not Found"


# --------------------------------------------------
# FIELD SALVAGE
# --------------------------------------------------

_KEYS = [
    "waiting_period",
    "pre_existing_disease",
    "room_rent_sublimit",
    "disease_specific_caps",
    "co_payment",
    "exclusions_clarity",
    "claim_procedure_complexity",
    "sublimits_and_caps",
    "restoration_benefit",
    "transparency_of_terms",
]


def _salvage_json(text: str):
    result = {}
    for key in _KEYS:
        match = re.search(rf'{key}.*?(High|Moderate|Low)', text, re.I)
        result[key] = _normalize(match.group(1)) if match else "Not Found"
    return json.dumps(result)