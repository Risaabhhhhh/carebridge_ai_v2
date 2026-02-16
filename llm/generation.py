import torch

def generate(prompt: str, model, tokenizer, max_new_tokens: int = 300):

    formatted_prompt = (
        "<bos><start_of_turn>user\n"
        f"{prompt}\n"
        "Respond ONLY in valid JSON. Do not explain. Do not add extra text."
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
            do_sample=False,  # deterministic
            temperature=0.0,
            use_cache=True,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.eos_token_id
        )

    generated_tokens = outputs[0][input_len:]

    output = tokenizer.decode(
        generated_tokens,
        skip_special_tokens=True
    ).strip()

    # Hard JSON extraction safety
    start = output.find("{")
    end = output.rfind("}") + 1

    if start != -1 and end != -1:
        output = output[start:end]

    return output
