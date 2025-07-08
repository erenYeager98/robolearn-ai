from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Load DeepSeek-R1-Distill-Qwen-1.5B model and tokenizer from Hugging Face
model_name = "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# Example query and content for semantic search
query = "What is photosynthesis?"
content = [
    "Photosynthesis is the process by which green plants and other organisms convert light energy into chemical energy.",
    "Machine learning is a subset of artificial intelligence that focuses on algorithms to learn from data.",
    "Quantum mechanics is the branch of physics dealing with phenomena on a very small scale, such as atomic and subatomic particles."
]

# Tokenize query and content
inputs = tokenizer([query] * len(content), content, padding=True, truncation=True, return_tensors="pt")

# Move model to the same device as input (for performance on larger models)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
inputs = inputs.to(device)

# Perform forward pass and get similarity scores
with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits

# Find the best match
best_match_idx = logits.argmax().item()
best_match = content[best_match_idx]

print("Query:", query)
print("Best matching content:", best_match)
