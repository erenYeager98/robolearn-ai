from fastapi import APIRouter, Request, File, UploadFile, Depends
from fastapi.responses import JSONResponse
from app.core.config import Settings
from app.api.deps import get_settings
from app.services import file_service

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok"}

@router.post("/upload-image")
async def upload_image_endpoint(request: Request, file: UploadFile = File(...)):
    url = await file_service.save_upload_file(request, file)
    return JSONResponse({"url": url})

@router.get("/config")
async def get_config_endpoint(settings: Settings = Depends(get_settings)):
    return {
        "model_path": settings.PIPER_MODEL_PATH,
        "piper_path": str(settings.PIPER_EXECUTABLE)
    }

@router.post("/debug-body")
async def debug_body(request: Request):
    body = await request.body()
    decoded_body = body.decode("utf-8")
    print("📦 Raw Body Received:", decoded_body)
    return {"raw": decoded_body}