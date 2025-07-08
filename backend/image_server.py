from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uuid
import os
import shutil

app = FastAPI()

# ---- CORS (adjust origin list to your needs) -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ---- Directory setup -------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
IMAGE_DIR = BASE_DIR / "images-cloud"
IMAGE_DIR.mkdir(exist_ok=True)              # create if missing

# ---- Serve static images ----------------------------------------------------
# Anything in images-cloud/ will be reachable at /images/filename.ext
app.mount("/images", StaticFiles(directory=str(IMAGE_DIR)), name="images")

# ---- Upload endpoint --------------------------------------------------------
@app.post("/upload-image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    # 1) Basic validation
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")

    # 2) Build a unique filename (to avoid collisions)
    suffix = Path(file.filename).suffix or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    dest_path = IMAGE_DIR / unique_name

    # 3) Save file
    try:
        with dest_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        await file.close()  # always close underlying SpooledTemporaryFile

    # 4) Construct public URL (uses host+port FastAPI is running on)
    public_url = str(request.base_url) + f"images/{unique_name}"

    return JSONResponse({"url": public_url})
