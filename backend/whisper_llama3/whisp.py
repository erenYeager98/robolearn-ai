from fastapi import FastAPI, WebSocket, Request
import os
import tempfile
import whisper
import subprocess
from fastapi.responses import JSONResponse
app = FastAPI()
model = whisper.load_model("small")
from fastapi.middleware.cors import CORSMiddleware


@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        audio_data = await websocket.receive_bytes()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f:
            f.write(audio_data)
            webm_path = f.name

        wav_path = webm_path.replace(".webm", ".wav")

        subprocess.run([
            "ffmpeg", "-y",
            "-i", webm_path,
            "-ar", "16000",
            "-ac", "1",
            wav_path
        ], check=True)

        result = model.transcribe(wav_path)
        await websocket.send_json({"text": result["text"]})

    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()
        for f in [webm_path, wav_path]:
            if os.path.exists(f):
                os.remove(f)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/research")
async def research_endpoint(request: Request):
    with open("demo_response.txt", "r", encoding="utf-8") as file:
        content = file.read()
    return JSONResponse(content={"response": content})