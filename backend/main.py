from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import torch
import whisper
import io
import base64
import numpy as np
import wave

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = whisper.load_model("tiny")

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    audio_buffer = bytearray()
    try:
        while True:
            data = await websocket.receive_bytes()
            audio_buffer.extend(data)
            if len(audio_buffer) > 16000 * 5:  # 5 seconds of audio
                audio_np = np.frombuffer(audio_buffer, np.int16).astype(np.float32) / 32768.0
                audio_buffer.clear()
                result = model.transcribe(audio_np, language='en', fp16=False)
                await websocket.send_json({"text": result['text']})
    except Exception as e:
        await websocket.close()

