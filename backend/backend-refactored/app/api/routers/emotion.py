from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, WebSocket, WebSocketDisconnect
from app.models.schemas import ImagePayload
from app.services import emotion_service
from app.api.deps import get_emotion_detector
from fer import FER
import base64

router = APIRouter()

@router.post("/detect-emotion")
async def detect_emotion_from_upload(
    file: UploadFile = File(...),
    detector: FER = Depends(get_emotion_detector)
):
    try:
        contents = await file.read()
        result = emotion_service.detect_emotion_from_bytes(detector, contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/emotion")
async def detect_emotion_from_base64(
    payload: ImagePayload,
    detector: FER = Depends(get_emotion_detector)
):
    try:
        image_data = base64.b64decode(payload.image_data.split(",")[1])
        result = emotion_service.detect_emotion_from_bytes(detector, image_data)
        return result
    except Exception as e:
        print(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {e}")


@router.websocket("/ws/emotion")
async def websocket_emotion_detection(
    websocket: WebSocket,
    detector: FER = Depends(get_emotion_detector)
):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            image_data = base64.b64decode(data.split(",")[1])
            result = emotion_service.detect_emotion_from_bytes(detector, image_data)
            await websocket.send_json(result)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")