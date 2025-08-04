import requests
from app.core.config import settings

def search_serper_scholar(query: str):
    """Performs a scholar search using the Serper.dev API."""
    headers = {
        'X-API-KEY': settings.SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    payload = {"q": query}
    response = requests.post("https://google.serper.dev/scholar", headers=headers, json=payload)
    response.raise_for_status()
    return response.json()

def search_serper_lens(image_url: str):
    """Performs a reverse image search using the Serper.dev Lens API."""
    headers = {
        'X-API-KEY': settings.SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    payload = {"url": image_url}
    response = requests.post("https://google.serper.dev/lens", headers=headers, json=payload)
    response.raise_for_status()
    return response.json()