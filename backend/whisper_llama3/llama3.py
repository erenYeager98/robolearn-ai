from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI()
# Enable CORS (modify allow_origins if needed for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],    
)

# Choose device: GPU if available, else CPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load model and tokenizer
model_id = "meta-llama/Llama-3.2-1B-Instruct"

tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
).to(device)

# Define input schema
class Query(BaseModel):
    question: str

# Define POST endpoint
@app.post("/research")
async def ask_question(query: Query):
    # Prepare prompt
    prompt = f"<|start_header_id|>user<|end_header_id|>\n{query.question}<|eot_id|>\n<|start_header_id|>assistant<|end_header_id|>\n"

    # Tokenize and move to device
    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    # Generate response
    output = model.generate(
        **inputs,
        max_new_tokens=512,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.1,
        eos_token_id=tokenizer.eos_token_id
    )

    # Decode and return answer
    decoded = tokenizer.decode(output[0], skip_special_tokens=False)

    # Safely extract the assistant's final reply
    if "<|start_header_id|>assistant<|end_header_id|>" in decoded:
        answer = decoded.split("<|start_header_id|>assistant<|end_header_id|>")[-1].strip()
    else:
        answer = decoded.strip()  # fallback
    if "<|eot_id|>" in answer:
        answer = answer.split("<|eot_id|>")[0].strip()
    print(f"Answer: {answer}")
    return {"answer": answer}

