from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fer import FER
import numpy as np
import cv2
import base64

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
detector = FER()

@app.post("/detect-emotion")
async def detect_emotion(file: UploadFile = File(...)):
    try:
        # Read uploaded file into a NumPy array
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        # Detect emotion
        top_emotion = detector.top_emotion(image)

        if top_emotion is None:
            return JSONResponse(content={"emotion": None, "score": 0.0, "message": "No face detected"}, status_code=200)

        emotion, score = top_emotion
        return {"emotion": emotion, "score": float(score)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.websocket("/ws/emotion")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # decode incoming image
            image_data = base64.b64decode(data.split(",")[1])
            nparr = np.frombuffer(image_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Get top emotion
            top = detector.top_emotion(frame)  # may be (None, None)
            if top and top[0] is not None:
                emotion, score = top
                # score is already numeric
                await websocket.send_json({
                    "emotion": emotion,
                    "score": round(float(score), 2)
                })
            else:
                # no face detected
                await websocket.send_json({
                    "emotion": None,
                    "score": 0.0
                })
    except WebSocketDisconnect:
        print("WebSocket disconnected")
