from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
import torch

# ✅ Correct HuggingFace model ID for MedGemma 4B instruct
MODEL_NAME = "google/medgemma-4b-it"

class ModelLoader:
    """
    Singleton model loader — ensures the model is only loaded once
    regardless of how many times ModelLoader() is called.
    Critical for 6GB VRAM: double-loading = instant OOM.
    """

    _instance = None  # singleton holder

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return  # already loaded, skip

        print("🔄 Loading MedGemma 4B in 4-bit mode...")

        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,   # activations in fp16
            bnb_4bit_use_double_quant=True,          # saves ~0.4GB extra
            bnb_4bit_quant_type="nf4",               # best quality/size tradeoff
        )

        self.tokenizer = AutoTokenizer.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True,
        )

        # ✅ Fix missing pad token (MedGemma tokenizer doesn't set one)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        self.model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            quantization_config=bnb_config,
            dtype=torch.float16,       # ✅ activations in fp16, not float32
            device_map="auto",
            max_memory={0: "5.5GiB", "cpu": "8GiB"},  # ✅ reserve 0.5GB headroom
            trust_remote_code=True,
        )

        self.model.eval()  # ✅ disable dropout, slightly faster inference

        self._initialized = True
        print("✅ MedGemma 4B loaded successfully in 4-bit mode")

    def get_model(self):
        return self.model, self.tokenizer