from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Set the base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # API Keys
    SERPER_API_KEY: str

    # Paths
    PIPER_EXECUTABLE: str
    PIPER_MODEL_PATH: str
    IMAGE_DIR: Path = BASE_DIR / "static" / "images"
    TEMP_DIR: Path = BASE_DIR / "temp_uploads"

    # Model IDs
    HF_MODEL_ID: str = "meta-llama/Llama-3.2-1B-Instruct"
    WHISPER_MODEL_SIZE: str = "small"
    OLLAMA_MODEL_NAME: str = "gemma3:4b"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["https://erenyeager-dk.live","*"]

    model_config = SettingsConfigDict(env_file=BASE_DIR.parent / ".env")

settings = Settings()