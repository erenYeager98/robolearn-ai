from fastapi import FastAPI
from fastapi.responses import JSONResponse
import subprocess
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your needs   
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/open-keyboard")
async def open_keyboard():
    try:
        # Run onboard with proper display environment
        subprocess.Popen(["onboard"], env={"DISPLAY": ":0", **dict(**subprocess.os.environ)})
        return JSONResponse(content={"status": "success", "message": "Onboard keyboard launched."}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)
