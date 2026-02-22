from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
import torch

MODEL_NAME = "google/medgemma-4b-it"


class ModelLoader:
    """
    Singleton loader for MedGemma 4B-IT (4-bit).

    ✔ prevents CUDA device-side assert
    ✔ forces Gemma padding requirements
    ✔ ensures pad/eos tokens always valid
    ✔ optimized for low VRAM environments
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        print("🔄 Loading MedGemma 4B in 4-bit mode...")

        # ─────────────────────────────────────
        # Quantization (fits in 6GB VRAM)
        # ─────────────────────────────────────
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
        )

        # ─────────────────────────────────────
        # Tokenizer
        # ─────────────────────────────────────
        self.tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True,
        )

        # 🔥 CRITICAL: Gemma requires pad_token == eos_token
        # DO NOT conditionally set — FORCE it.
        self.tokenizer.pad_token = self.tokenizer.eos_token
        self.tokenizer.pad_token_id = self.tokenizer.eos_token_id

        # decoder-only models prefer left padding
        self.tokenizer.padding_side = "left"

        # ─────────────────────────────────────
        # Load model
        # ─────────────────────────────────────
        self.model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            quantization_config=bnb_config,
            dtype=torch.float16,          # correct (torch_dtype deprecated)
            device_map="auto",
            max_memory={0: "5.5GiB", "cpu": "8GiB"},
            trust_remote_code=True,
        )

        # ─────────────────────────────────────
        # 🔥 CRITICAL: Sync model config tokens
        # prevents CUDA assert & generation crash
        # ─────────────────────────────────────
        self.model.config.pad_token_id = self.tokenizer.pad_token_id
        self.model.config.eos_token_id = self.tokenizer.eos_token_id

        self.model.generation_config.pad_token_id = self.tokenizer.pad_token_id
        self.model.generation_config.eos_token_id = self.tokenizer.eos_token_id

        # Safety checks
        assert self.tokenizer.pad_token_id is not None, "pad_token_id is None"
        assert self.model.config.pad_token_id is not None, "model pad_token_id None"

        self.model.eval()
        self._initialized = True

        print("✅ MedGemma 4B loaded in 4-bit mode")
        print(f"   pad_token_id : {self.tokenizer.pad_token_id}")
        print(f"   eos_token_id : {self.tokenizer.eos_token_id}")

    def get_model(self):
        return self.model, self.tokenizer