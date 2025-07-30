from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fer import FER
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import tempfile
import os
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
import numpy as np
import cv2
import base64
import torch
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files from dist/ (React build output)
app.mount("/assets", StaticFiles(directory="../frontend/dist/assets"), name="assets")

@app.get("/")
async def serve_root():
    return FileResponse("../frontend/dist/index.html")


# Load shared tokenizer and two separate models
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

detector = FER()


model_id = "meta-llama/Llama-3.2-1B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(model_id)

# Separate model instances
model_research = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
).to(device)

model_summarize = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
).to(device)

# Request Schemas
class Query(BaseModel):
    question: str
    emotion: str

class SummarizeRequest(BaseModel):
    content: str

# Instruction for research endpoint
RESEARCH_INSTRUCTION = (
    "You are a smart, friendly AI learning assistant.\n"
    "Always respond with a **concise and clear summary (within 80–110 words)** "
    "of the topic or query provided.\n"
    "If the user's query is irrelevant, vague, or unclear, politely ask for a better question.\n"
    "Your tone should be helpful, supportive, and curious.\n\n"
)

@app.post("/api/research")
async def ask_question(query: Query):
    print(f"Received question: {query.question}")
    print(f"Emotion: {query.emotion}")

    # Emotion-specific instruction
    if query.emotion.lower() in ["neutral", "sad"]:
        emotion_instruction = (
            "The user is in a calm or low mood, so provide a **basic, clear outline** of the topic "
            "that is easy to follow and not too dense."
        )
    elif query.emotion.lower() in ["happy", "excited", "joy"]:
        emotion_instruction = (
            "The user is in a good mood, so feel free to include a **bit more depth** and detail in your explanation."
        )
    else:
        emotion_instruction = (
            "Adjust your response tone to suit the user's emotion. Prioritize clarity."
        )

    # Final dynamic instruction block
    dynamic_instruction = (
        f"You are a smart, friendly AI learning assistant.\n"
        f"Always respond with a **concise and clear explanation (within 100–150 words)**.\n"
        f"If the query is vague, ask for clarification.\n"
        f"{emotion_instruction}\n"
        f"Your tone should remain helpful, supportive, and curious.\n\n"
    )

    prompt = (
        f"<|start_header_id|>system<|end_header_id|>\n{dynamic_instruction}<|eot_id|>\n"
        f"<|start_header_id|>user<|end_header_id|>\nQuery: {query.question}\nEmotion: {query.emotion}<|eot_id|>\n"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        output = model_research.generate(
            **inputs,
            max_new_tokens=256,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            eos_token_id=tokenizer.eos_token_id,
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=False)

    if "<|start_header_id|>assistant<|end_header_id|>" in decoded:
        answer = decoded.split("<|start_header_id|>assistant<|end_header_id|>")[-1].strip()
    else:
        answer = decoded.strip()

    if "<|eot_id|>" in answer:
        answer = answer.split("<|eot_id|>")[0].strip()

    print(f"Answer: {answer}")
    return {"answer": answer}


@app.post("/api/summarize")
async def summarize_text(request: SummarizeRequest):
    INSTRUCTION = (
        "You are an expert academic assistant.\n"
        "Summarize the given content in about 50 words, even if the given content is shorter, you have to make up some stuff and make about 50 words\n"
        "The summary must start with: 'This article states that'.\n"
        "Write clearly and professionally. Do not add notes, opinions, or extra commentary.\n"
        "Your response should be clean and suitable to be used directly in a research abstract.\n"
    )

    prompt = (
        f"<|start_header_id|>system<|end_header_id|>\n{INSTRUCTION}<|eot_id|>\n"
        f"<|start_header_id|>user<|end_header_id|>\n{request.content.strip()}<|eot_id|>\n"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
        f"This article states that "
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(device)

    with torch.no_grad():
        output = model_summarize.generate(
            **inputs,
            max_new_tokens=200,
            do_sample=False,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            eos_token_id=tokenizer.eos_token_id,
        )

    decoded = tokenizer.decode(output[0], skip_special_tokens=False)

    # Extract assistant section
    if "<|start_header_id|>assistant<|end_header_id|>" in decoded:
        answer = decoded.split("<|start_header_id|>assistant<|end_header_id|>")[-1]
    else:
        answer = decoded

    # Cut at end-of-turn token
    if "<|eot_id|>" in answer:
        answer = answer.split("<|eot_id|>")[0]

    summary = answer.strip()

    return {"answer": summary}

@app.post("/api/detect-emotion")
async def detect_emotion(file: UploadFile = File(...)):
    try:
        # Read uploaded file into a NumPy array
        contents = await file.read()
        np_arr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image")

        # Detect emotion
        top_emotion = detector.top_emotion(image)

        if top_emotion is None:
            return JSONResponse(content={"emotion": None, "score": 0.0, "message": "No face detected"}, status_code=200)

        emotion, score = top_emotion
        return {"emotion": emotion, "score": float(score)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.websocket("/ws/emotion")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            print("Received data:") if data else print("No data received")
            # decode incoming image
            image_data = base64.b64decode(data.split(",")[1])
            nparr = np.frombuffer(image_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Get top emotion
            top = detector.top_emotion(frame)  # may be (None, None)
            if top and top[0] is not None:
                emotion, score = top
                # score is already numeric
                await websocket.send_json({
                    "emotion": emotion,
                    "score": round(float(score), 2)
                })
            else:
                # no face detected
                await websocket.send_json({
                    "emotion": None,
                    "score": 0.0
                })
    except WebSocketDisconnect:
        print("WebSocket disconnected")



#Serper.dev Scholar Search API

class SearchQueryOnSerper(BaseModel):
    q: str

@app.post("/api/search-scholar")
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
@app.post("/api/search-lens")
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
@app.post("/api/upload-image")
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



# Windows paths to Piper binary and ONNX model
PIPER_EXECUTABLE = "C:\\Users\\eren\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\piper.exe"  # Path to piper.exe
PIPER_MODEL_PATH = "C:\\Users\\eren\\Documents\\robolearn-ai\\robolearn-ai\\backend\\text-to-speech\\en_US-lessac-high.onnx"  # Path to model


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


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """
    Catch-all route for React Router paths.
    Always returns index.html, letting React handle the routing.
    """
    return FileResponse("../frontend/dist/index.html")
