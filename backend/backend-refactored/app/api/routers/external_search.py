from fastapi import APIRouter, HTTPException
from app.models.schemas import SerperQuery, SerperLensQuery
from app.services import external_api_service
import requests

router = APIRouter()

@router.post("/search-scholar")
def search_scholar_endpoint(data: SerperQuery):
    try:
        return external_api_service.search_serper_scholar(data.q)
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Serper API failed: {e}")

@router.post("/search-lens")
def search_lens_endpoint(data: SerperLensQuery):
    try:
        return external_api_service.search_serper_lens(data.url)
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Serper API failed: {e}")