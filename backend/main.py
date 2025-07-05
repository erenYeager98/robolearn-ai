from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
import whisper
import io

# Initialize the Whisper Tiny model
model = whisper.load_model("tiny")

app = FastAPI()

class SpeechTextResponse(BaseModel):
    text: str

@app.post("/speech-to-text", response_model=SpeechTextResponse)
async def speech_to_text(file: UploadFile = File(...)):
    # Read the file
    audio_bytes = await file.read()
    
    # Load audio to Whisper
    audio = whisper.load_audio(io.BytesIO(audio_bytes))
    audio = whisper.pad_or_trim(audio)

    # Transcribe using Whisper model
    result = model.transcribe(audio)
    
    return {"text": result["text"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
