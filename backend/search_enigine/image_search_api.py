from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from fastapi import Request

# ----------------------- Setup FastAPI ----------------------------
app = FastAPI()

# ----------------------- CORS for React Frontend -------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------- Pydantic Model ---------------------------
class SearchQuery(BaseModel):
    url: str

# ----------------------- Serper.dev Lens Proxy --------------------
@app.post("/search-lens")
def search_lens(data: SearchQuery):
    headers = {
        'X-API-KEY': 'c8fa1043c013a0719fb8cdbc8b254c6f18d0c864',  
        'Content-Type': 'application/json'
    }

    payload = { "url": data.url }

    try:
        response = requests.post("https://google.serper.dev/lens", headers=headers, json=payload)
        response.raise_for_status()  # raise if 4xx or 5xx
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Serper API failed: {e}")

    return response.json()

@app.post("/debug-body")
async def debug_body(request: Request):
    body = await request.body()
    print("📦 Raw Body Received:", body.decode("utf-8"))
    return {"raw": body.decode("utf-8")}