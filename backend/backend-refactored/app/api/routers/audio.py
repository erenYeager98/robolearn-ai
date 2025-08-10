from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Response
from fastapi.responses import JSONResponse
from app.models.schemas import TTSRequest
from app.services import audio_service
from app.api.deps import get_whisper_model

router = APIRouter()

@router.post("/transcribe")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    model = Depends(get_whisper_model)
):
    if file.content_type != "audio/webm":
        raise HTTPException(status_code=400, detail="Invalid file type, must be audio/webm")
    try:
        transcription = await audio_service.transcribe_audio(model, file)
        return JSONResponse(content={"prompt": "Say something about your favorite technology.","transcription": transcription})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text-to-speech")
async def text_to_speech_endpoint(request: TTSRequest):
    try:
        audio_data = audio_service.generate_tts_audio(request.text)
        return Response(content=audio_data, media_type="audio/wav")
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")