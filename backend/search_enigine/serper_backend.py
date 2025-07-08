import requests
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # <-- Your React frontend
    allow_credentials=True,
    allow_methods=["*"],                      # allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],                      # allow all headers (including Content-Type)
)


class SearchQuery(BaseModel):
    q: str

@app.post("/search-scholar")
def search_scholar(data: SearchQuery):
    headers = {
        'X-API-KEY': 'c8fa1043c013a0719fb8cdbc8b254c6f18d0c864',
        'Content-Type': 'application/json'
    }
    payload = {
        "q": data.q
    }

    response = requests.post("https://google.serper.dev/scholar", headers=headers, json=payload)
    return response.json()
