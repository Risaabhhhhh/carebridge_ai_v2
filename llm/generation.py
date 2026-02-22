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
    temperature: float = 0.0,   # 0.0 = greedy; >0 = sampling
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
        max_length=2800,
        add_special_tokens=True,
    ).to(model.device)

    input_len = inputs["input_ids"].shape[1]
    print(f"Input tokens: {input_len} | Max new: {max_new_tokens}")

    result_container = {"output": None, "error": None}

    def _run():
        try:
            with torch.no_grad():
                use_sampling = temperature > 0.0 and not json_mode
                out = model.generate(
                    input_ids=inputs["input_ids"],
                    attention_mask=inputs["attention_mask"],
                    max_new_tokens=max_new_tokens,
                    do_sample=use_sampling,
                    temperature=temperature if use_sampling else 1.0,
                    top_p=0.9 if use_sampling else 1.0,
                    repetition_penalty=1.15,
                    use_cache=True,
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

    print("MODEL RAW OUTPUT:", repr(decoded[:500]))

    if not decoded:
        print("Empty output after decode")
        return "{}" if json_mode else ""

    if json_mode:
        return _extract_json(decoded)

    return decoded


# ──────────────────────────────────────────────────────────────────
# JSON EXTRACTION PIPELINE
# ──────────────────────────────────────────────────────────────────

def _extract_json(text: str) -> str:
    # 1️⃣ Direct parse
    try:
        parsed = json.loads(text.strip())
        if isinstance(parsed, dict):
            print(f"_extract_json: direct parse OK, {len(parsed)} keys")
            return json.dumps(parsed)
    except Exception:
        pass

    # 2️⃣ Greedy brace extraction
    for pattern in (r"\{[^{}]*\}", r"\{[\s\S]*\}"):
        match = re.search(pattern, text)
        if match:
            candidate = match.group(0)
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    print(f"_extract_json: greedy match OK ({pattern}), {len(parsed)} keys")
                    return json.dumps(parsed)
            except Exception:
                pass

            repaired = _repair_truncated_json(candidate)
            if repaired:
                print(f"_extract_json: repaired OK, {len(repaired)} keys")
                return json.dumps(repaired)

    # 3️⃣ Field salvage fallback
    print("_extract_json: falling back to field salvage")
    return _salvage_json(text)


def _repair_truncated_json(text: str) -> dict | None:
    """Attempt to repair truncated JSON."""
    for suffix in ('', '"', '"}', '" }', '}'):
        for prefix in ('', '{'):
            attempt = prefix + text.rstrip(", \n") + suffix
            try:
                parsed = json.loads(attempt)
                if isinstance(parsed, dict) and len(parsed) >= 1:
                    return parsed
            except Exception:
                continue
    return None


# ──────────────────────────────────────────────────────────────────
# VALUE NORMALIZATION
# ──────────────────────────────────────────────────────────────────

_VALUE_MAP = {
    "high risk": "High Risk",
    "high": "High Risk",
    "moderate risk": "Moderate Risk",
    "moderate": "Moderate Risk",
    "medium risk": "Moderate Risk",
    "medium": "Moderate Risk",
    "low risk": "Low Risk",
    "low": "Low Risk",
    "not found": "Not Found",
    "not detected": "Not Found",
    "not mentioned": "Not Found",
    "not applicable": "Not Found",
    "not available": "Not Found",
    "not specified": "Not Found",
    "n/a": "Not Found",
    "na": "Not Found",
    "none": "Not Found",
    "unclear": "Not Found",
    "unknown": "Not Found",
}


def _normalize_risk_value(raw: str) -> str:
    v = raw.strip().lower().strip('"\'').strip()
    if v in _VALUE_MAP:
        return _VALUE_MAP[v]
    if "high" in v:
        return "High Risk"
    if "moderate" in v or "medium" in v:
        return "Moderate Risk"
    if "low" in v:
        return "Low Risk"
    return "Not Found"


# ──────────────────────────────────────────────────────────────────
# FIELD SALVAGE
# ──────────────────────────────────────────────────────────────────

_PREPURCHASE_KEYS = [
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


def _salvage_json(text: str) -> str:
    result = {k: _extract_field(text, k) for k in _PREPURCHASE_KEYS}
    found = sum(1 for v in result.values() if v != "Not Found")
    print(f"_salvage_json extracted {found}/10 fields")
    return json.dumps(result)


def _extract_field(text: str, key: str) -> str:
    k = re.escape(key)
    patterns = [
        rf'"{k}"\s*:\s*"([^"]+)"',
        rf'"{k}"\s*:\s*([A-Za-z][A-Za-z\s]{{2,20}})(?=[,\n\r}}"])',
        rf"'{k}'\s*:\s*'([^']+)'",
        rf'{k}\s*:\s*"([^"]+)"',
        rf'{k}\s*:\s*([A-Za-z][A-Za-z\s]{{2,20}})(?=[,\n\r}}"])',
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            candidate = m.group(1).strip()
            return _normalize_risk_value(candidate)
    return "Not Found"