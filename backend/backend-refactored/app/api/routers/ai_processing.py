from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.models.schemas import ResearchQuery, SummarizeRequest
from app.api.deps import get_hf_models
from app.services import ai_service, file_service
import os
import asyncio

router = APIRouter()

@router.post("/research")
async def research_endpoint(
    query: ResearchQuery,
    models: tuple = Depends(get_hf_models)
):
    tokenizer, model_research, _, device = models
    answer = await asyncio.to_thread(
        ai_service.generate_research_response, 
        tokenizer, 
        model_research, 
        device, 
        query.question, 
        query.emotion
    )
    return {"answer": answer}

@router.post("/summarize")
async def summarize_endpoint(
    request: SummarizeRequest,
    models: tuple = Depends(get_hf_models)
):
    tokenizer, _, model_summarize, device = models
    summary = await asyncio.to_thread(
        ai_service.generate_summary,
        tokenizer,
        model_summarize,
        device,
        request.content
    )
    return {"answer": summary}
    
@router.post("/analyze-image")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    temp_file_path = file_service.save_temp_file(file)
    try:
        #model_output = ai_service.analyze_image_with_ollama(temp_file_path)
        #print("Model output:", model_output)
        model_output = "dummy response"
        return {"filename": file.filename, "response": model_output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
