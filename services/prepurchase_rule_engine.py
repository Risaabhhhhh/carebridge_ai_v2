def extract_structured_features(policy_text: str):

    text = policy_text.lower()

    features = {
        "has_waiting_period": "waiting period" in text,
        "mentions_pre_existing": "pre-existing" in text,
        "room_rent_cap": "room rent" in text,
        "co_payment": "co-pay" in text or "copay" in text,
        "disease_caps": "limit" in text or "sublimit" in text
    }

    return features
