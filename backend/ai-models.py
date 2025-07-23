from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
from fastapi.middleware.cors import CORSMiddleware
import torch

app = FastAPI()

# Enable CORS for browser use
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load shared tokenizer and two separate models
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

model_id = "meta-llama/Llama-3.2-1B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_id)

# Separate model instances
model_research = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
).to(device)

model_summarize = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
).to(device)

# Request Schemas
class Query(BaseModel):
    question: str

class SummarizeRequest(BaseModel):
    content: str

# Instruction for research endpoint
RESEARCH_INSTRUCTION = (
    "You are a smart, friendly AI learning assistant.\n"
    "Always respond with a **concise and clear summary (within 80–110 words)** "
    "of the topic or query provided.\n"
    "If the user's query is irrelevant, vague, or unclear, politely ask for a better question.\n"
    "Your tone should be helpful, supportive, and curious.\n\n"
)

@app.post("/research")
async def ask_question(query: Query):
    prompt = (
        f"<|start_header_id|>system<|end_header_id|>\n{RESEARCH_INSTRUCTION}<|eot_id|>\n"
        f"<|start_header_id|>user<|end_header_id|>\n{query.question}<|eot_id|>\n"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        output = model_research.generate(
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

@app.post("/summarize")
async def summarize_text(request: SummarizeRequest):
    INSTRUCTION = (
        "You are an expert academic assistant.\n"
        "Summarize the given content in about 50 words, even if the given content is shorter, you have to make up some stuff and make about 50 words\n"
        "The summary must start with: 'This article states that'.\n"
        "Write clearly and professionally. Do not add notes, opinions, or extra commentary.\n"
        "Your response should be clean and suitable to be used directly in a research abstract.\n"
    )

    prompt = (
        f"<|start_header_id|>system<|end_header_id|>\n{INSTRUCTION}<|eot_id|>\n"
        f"<|start_header_id|>user<|end_header_id|>\n{request.content.strip()}<|eot_id|>\n"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
        f"This article states that "
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        output = model_summarize.generate(
            **inputs,
            max_new_tokens=200,
            do_sample=False,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            eos_token_id=tokenizer.eos_token_id,
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=False)

    # Extract assistant section
    if "<|start_header_id|>assistant<|end_header_id|>" in decoded:
        answer = decoded.split("<|start_header_id|>assistant<|end_header_id|>")[-1]
    else:
        answer = decoded

    # Cut at end-of-turn token
    if "<|eot_id|>" in answer:
        answer = answer.split("<|eot_id|>")[0]

    summary = answer.strip()

    return {"answer": summary}
