import torch
import re


def generate(
    prompt: str,
    model,
    tokenizer,
    max_new_tokens: int = 512,   # ↑ allow full JSON
    json_mode: bool = False,
):

    if json_mode:
        instruction = (
    "Return ONLY valid JSON.\n"
    "Do not include thoughts.\n"
    "Do not include explanations.\n"
    "Do not include markdown.\n"
    "Start with { and end with }.\n"
        )
    else:
        instruction = "Respond clearly and concisely."

    formatted_prompt = (
        "<bos><start_of_turn>user\n"
        f"{prompt}\n{instruction}"
        "<end_of_turn>\n"
        "<start_of_turn>model\n"
    )

    inputs = tokenizer(
        formatted_prompt,
        return_tensors="pt",
        truncation=True,
        max_length=2048
    ).to(model.device)

    input_len = inputs["input_ids"].shape[1]

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,

            do_sample=False if json_mode else True,

            # 🔥 CRITICAL: stop reasoning
            temperature=None if json_mode else 0.3,
            top_p=1.0,

            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.eos_token_id,
        )

    generated_tokens = outputs[0][input_len:]

    decoded = tokenizer.decode(
        generated_tokens,
        skip_special_tokens=True
    ).strip()

    # 🔥 REMOVE reasoning artifacts
    decoded = decoded.replace("<unused94>", "")
    decoded = decoded.replace("thought", "")
    decoded = decoded.replace("analysis", "")

    if json_mode:
        match = re.search(r"\{[\s\S]*\}", decoded)
        if match:
            decoded = match.group(0)
        else:
            print("⚠️ JSON not found in model output")
            print(decoded)

    return decoded