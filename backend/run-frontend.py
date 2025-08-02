from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://erenyeager-dk.live"],  # Adjust this to your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set correct relative path from backend → frontend/dist
FRONTEND_DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
INDEX_FILE = os.path.join(FRONTEND_DIST_DIR, "index.html")

# Serve static assets (like JS/CSS)
app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="assets")

# Example API route
@app.get("/api/hello")
def api_hello():
    return {"message": "Hello from FastAPI backend"}

# Catch-all route: Serve index.html for all non-API paths
@app.get("/{full_path:path}")
async def serve_vue(full_path: str):
    if full_path.startswith("api"):
        return {"detail": "API route not found"}, 404

    if os.path.exists(INDEX_FILE):
        return FileResponse(INDEX_FILE)
    return {"detail": "Frontend not built"}, 500
