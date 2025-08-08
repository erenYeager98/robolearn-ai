# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager  # <-- 1. Import the context manager

from app.core.config import settings
from app.services import ai_service, emotion_service, audio_service
from app.api.routers import ai_processing, audio, emotion, external_search, utility, proxy
import os

# 2. Define the lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    print("--- Server Starting Up ---")
    # Create directories
    settings.IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    settings.TEMP_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load models and store them in app.state
    print("Loading Hugging Face models...")
    app.state.hf_models = ai_service.load_hf_models()
    print("Hugging Face models loaded and available.")

    print("Loading emotion detector...")
    app.state.emotion_detector = emotion_service.load_detector()
    print("Emotion detector loaded and available.")

    print("Loading Whisper model...")
    app.state.whisper_model = audio_service.load_whisper_model()
    print("Whisper model loaded and available.")
    
    yield  # The application is now running
    
    # Code to run on shutdown
    print("--- Server Shutting Down ---")
    # You can add cleanup code here if needed


# 3. Pass the lifespan manager to the FastAPI app
app = FastAPI(title="AI Learning Assistant API", lifespan=lifespan)

# --- The rest of your file remains the same ---

# Setup CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory
app.mount("/static/images", StaticFiles(directory=settings.IMAGE_DIR), name="images")

# Include API routers
api_prefix = "/api"
app.include_router(ai_processing.router, prefix=api_prefix, tags=["AI Processing"])
app.include_router(audio.router, prefix=api_prefix, tags=["Audio"])
app.include_router(emotion.router, prefix=api_prefix, tags=["Emotion"])
app.include_router(external_search.router, prefix=api_prefix, tags=["External Search"])
app.include_router(utility.router, prefix=api_prefix, tags=["Utility"])
app.include_router(proxy.router, prefix=api_prefix, tags=["Proxy"])

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the AI Learning Assistant API"}