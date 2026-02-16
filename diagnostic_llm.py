import torch
from llm.model_loader import ModelLoader
from llm.generation import generate

print("CUDA AVAILABLE:", torch.cuda.is_available())

if torch.cuda.is_available():
    print("GPU NAME:", torch.cuda.get_device_name(0))
    print("VRAM BEFORE LOAD (GB):",
          torch.cuda.memory_allocated(0) / 1e9)

loader = ModelLoader()
model, tokenizer = loader.get_model()

if torch.cuda.is_available():
    print("VRAM AFTER LOAD (GB):",
          torch.cuda.memory_allocated(0) / 1e9)

response = generate(
    "Explain health insurance in one simple sentence.",
    model,
    tokenizer
)

print("\nMODEL RESPONSE:\n", response)

if torch.cuda.is_available():
    print("\nVRAM AFTER GENERATION (GB):",
          torch.cuda.memory_allocated(0) / 1e9)
