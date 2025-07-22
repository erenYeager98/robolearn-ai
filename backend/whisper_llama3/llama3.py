from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

model_id = "meta-llama/Llama-3.2-1B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_id)

model = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
).to(device)

class Query(BaseModel):
    question: str

# Instruction for every request
INSTRUCTION = (
    "You are a smart, friendly AI learning assistant.\n"
    "Always respond with a **concise and clear summary (within 70–100 words)** "
    "of the topic or query provided.\n"
    "If the user's query is irrelevant, vague, or unclear, politely ask for a better question.\n"
    "Your tone should be helpful, supportive, and curious.\n\n"
)

@app.post("/research")
async def ask_question(query: Query):
    prompt = (
        f"<|start_header_id|>system<|end_header_id|>\n{INSTRUCTION}<|eot_id|>\n"
        f"<|start_header_id|>user<|end_header_id|>\n{query.question}<|eot_id|>\n"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    output = model.generate(
        **inputs,
        max_new_tokens=256,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.1,
        eos_token_id=tokenizer.eos_token_id,
    )

    decoded = tokenizer.decode(output[0], skip_special_tokens=False)

    if "<|start_header_id|>assistant<|end_header_id|>" in decoded:
        answer = decoded.split("<|start_header_id|>assistant<|end_header_id|>")[-1].strip()
    else:
        answer = decoded.strip()

    if "<|eot_id|>" in answer:
        answer = answer.split("<|eot_id|>")[0].strip()

    print(f"Answer: {answer}")
    return {"answer": answer}
