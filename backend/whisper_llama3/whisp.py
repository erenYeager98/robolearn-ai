from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import subprocess
import os
import whisper

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
model = whisper.load_model("small")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        if file.content_type != "audio/webm":
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Save uploaded WebM file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f:
            f.write(await file.read())
            webm_path = f.name

        wav_path = webm_path.replace(".webm", ".wav")

        # Convert to WAV for Whisper
        subprocess.run([
            "ffmpeg", "-y",
            "-i", webm_path,
            "-ar", "16000",
            "-ac", "1",
            wav_path
        ], check=True)

        # Transcribe
        result = model.transcribe(wav_path)

        # Cleanup
        os.remove(webm_path)
        os.remove(wav_path)

        return JSONResponse(content={
            "prompt": "Say something about your favorite technology.",  # Custom prompt
            "transcription": result["text"]
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
