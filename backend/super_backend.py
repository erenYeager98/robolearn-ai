import requests
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Request
from pathlib import Path
from fastapi.responses import JSONResponse
import uuid
import os
import shutil

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],                     
    allow_headers=["*"],                      
)

#Serper.dev Scholar Search API

class SearchQueryOnSerper(BaseModel):
    q: str

@app.post("/search-scholar")
def search_scholar(data_serper: SearchQueryOnSerper):
    headers = {
        'X-API-KEY': 'c8fa1043c013a0719fb8cdbc8b254c6f18d0c864',
        'Content-Type': 'application/json'
    }
    payload = {
        "q": data_serper.q
    }

    response = requests.post("https://google.serper.dev/scholar", headers=headers, json=payload)
    return response.json()

#Image Search API

class SearchQueryOnSerperImage(BaseModel):
    url: str

# ----------------------- Serper.dev Lens Proxy --------------------
@app.post("/search-lens")
def search_lens(data_serper_image: SearchQueryOnSerperImage):
    headers = {
        'X-API-KEY': 'c8fa1043c013a0719fb8cdbc8b254c6f18d0c864',  
        'Content-Type': 'application/json'
    }

    payload = { "url": data_serper_image.url }

    try:
        response = requests.post("https://google.serper.dev/lens", headers=headers, json=payload)
        response.raise_for_status()  # raise if 4xx or 5xx
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Serper API failed: {e}")

    return response.json()

#Image Upload API

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



@app.post("/debug-body")
async def debug_body(request: Request):
    body = await request.body()
    print("📦 Raw Body Received:", body.decode("utf-8"))
    return {"raw": body.decode("utf-8")}

