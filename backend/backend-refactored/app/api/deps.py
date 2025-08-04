from functools import lru_cache
from app.services import ai_service, emotion_service, audio_service
from app.core.config import settings
from fastapi import Request

@lru_cache()
def get_settings():
    return settings

@lru_cache()
def get_hf_models(request: Request):
    return request.app.state.hf_models

@lru_cache()
def get_emotion_detector(request: Request):
    return request.app.state.emotion_detector

@lru_cache()
def get_whisper_model(request: Request):
    return request.app.state.whisper_model