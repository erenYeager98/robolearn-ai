import whisper
import subprocess
import tempfile
import os
from app.core.config import settings

def load_whisper_model():
    """Loads the Whisper model instance."""
    print(f"Loading Whisper model: {settings.WHISPER_MODEL_SIZE}")
    model = whisper.load_model(settings.WHISPER_MODEL_SIZE)
    print("Whisper model loaded.")
    return model

async def transcribe_audio(model, audio_file):
    """Saves, converts, and transcribes an audio file."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_webm:
        contents = await audio_file.read()
        temp_webm.write(contents)
        webm_path = temp_webm.name

    wav_path = webm_path.replace(".webm", ".wav")

    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", webm_path, "-ar", "16000", "-ac", "1", wav_path],
            check=True, capture_output=True, text=True
        )
        result = model.transcribe(wav_path)
        return result["text"]
    finally:
        if os.path.exists(webm_path):
            os.remove(webm_path)
        if os.path.exists(wav_path):
            os.remove(wav_path)

def generate_tts_audio(text: str) -> bytes:
    """Generates speech from text using Piper and returns audio bytes."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
        temp_wav_path = temp_wav.name

    try:
        process = subprocess.Popen(
            [settings.PIPER_EXECUTABLE, "--model", settings.PIPER_MODEL_PATH, "--output_file", temp_wav_path],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        process.stdin.write(text.encode())
        process.stdin.close()
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            raise RuntimeError(f"Piper error: {stderr.decode()}")

        with open(temp_wav_path, "rb") as f:
            audio_data = f.read()
        return audio_data
    finally:
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)