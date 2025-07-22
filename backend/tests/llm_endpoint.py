from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],                     
    allow_headers=["*"],                      
)

class LLMInput(BaseModel):
    instruction: str
    content: str

@app.post("/summarize")
async def summarize(input: LLMInput):
    # Simulated summary (replace with actual model inference)
    return {
        "summary": input.content[:80] + "..."
    }
