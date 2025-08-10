import whisper
import subprocess
import tempfile
import os
from app.core.config import settings
import whisperx

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
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
        wav_path = temp_wav.name

    # Generate speech with Piper
    subprocess.run(
        [settings.PIPER_EXECUTABLE, "--model", settings.PIPER_MODEL_PATH, "--output_file", wav_path],
        input=text.encode(),
        check=True
    )

    # Load WhisperX model
    model = whisperx.load_model("base", device="cpu")
    audio = whisperx.load_audio(wav_path)
    result = model.transcribe(audio)

    # Extract word-level timestamps
    word_timestamps = []
    for seg in result["segments"]:
        for word_info in seg["words"]:
            word_timestamps.append({
                "word": word_info["word"],
                "start": word_info["start"],
                "end": word_info["end"]
            })

    with open(wav_path, "rb") as f:
        audio_data = f.read()

    os.remove(wav_path)
    return audio_data, word_timestamps