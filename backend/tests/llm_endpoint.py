from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

app = FastAPI()

# Load LLaMA3 model and tokenizer (can be replaced with your own path or Hugging Face repo)
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.2-1B-Instruct")
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-1B-Instruct")
summarizer = pipeline("text-generation", model=model, tokenizer=tokenizer, max_new_tokens=200)

class SummarizeRequest(BaseModel):
    content: str

@app.post("/summarize")
async def summarize_text(request: SummarizeRequest):
    prompt = (
        "Summarize the following text (50 words) in a way that starts with "
        "'This article states that':\n\n"
        f"{request.content.strip()}\n\nSummary:"
    )
    
    try:
        response = summarizer(prompt, do_sample=False)[0]['generated_text']
        summary = response.split("Summary:")[-1].strip()
        return {"answer": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
