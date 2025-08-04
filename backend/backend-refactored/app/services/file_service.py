import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, Request, HTTPException
from app.core.config import settings

async def save_upload_file(request: Request, file: UploadFile) -> str:
    """Saves an uploaded image and returns its public URL."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")

    suffix = Path(file.filename).suffix or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    dest_path = settings.IMAGE_DIR / unique_name

    try:
        with dest_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        await file.close()

    public_url = str(request.base_url) + f"static/images/{unique_name}"
    return public_url

def save_temp_file(file: UploadFile) -> str:
    """Saves an uploaded file to a temporary directory."""
    try:
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        temp_file_path = str(settings.TEMP_DIR / unique_filename)
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return temp_file_path
    finally:
        file.file.close()