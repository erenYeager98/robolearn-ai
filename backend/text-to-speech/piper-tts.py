from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import tempfile
import os

app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Windows paths to Piper binary and ONNX model
PIPER_EXECUTABLE = "C:\\Users\\eren\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\piper.exe"  # Path to piper.exe
PIPER_MODEL_PATH = "C:\\Users\\eren\\Documents\\robolearn-ai\\robolearn-ai\\backend\\text-to-speech\\en_US-amy-medium.onnx"  # Path to model


class TTSRequest(BaseModel):
    text: str


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/config")
async def get_config():
    return {
        "model_path": PIPER_MODEL_PATH,
        "piper_path": PIPER_EXECUTABLE
    }


@app.post("/api/text-to-speech")
async def text_to_speech(request: TTSRequest):
    user_text = request.text.strip()

    # Optional system instruction override
    full_prompt =  user_text

    # Create a temp wav file
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
        temp_wav_path = temp_wav.name

    try:
        process = subprocess.Popen(
            [PIPER_EXECUTABLE, "--model", PIPER_MODEL_PATH, "--output_file", temp_wav_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        process.stdin.write(full_prompt.encode())
        process.stdin.close()
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            return Response(content=f"Piper error: {stderr.decode()}", status_code=500)

        with open(temp_wav_path, "rb") as f:
            audio_data = f.read()

        return Response(content=audio_data, media_type="audio/wav")

    finally:
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)
