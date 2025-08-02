import ollama
import shutil
import os
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware  

# --- FastAPI App Initialization ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
MODEL_NAME = 'gemma3:4b'
# The instruction prompt as requested
INSTRUCTION_PROMPT = "answer the question shown in the image."
# Directory to store temporary images
TEMP_DIR = "temp_uploads"

@app.on_event("startup")
async def startup_event():
    """Create the temporary directory on app startup."""
    os.makedirs(TEMP_DIR, exist_ok=True)


@app.post("/analyze-image/")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    """
    Accepts an image file and returns the model's analysis based on a fixed prompt.
    """
    # Create a unique temporary path to save the uploaded file
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_file_path = os.path.join(TEMP_DIR, unique_filename)

    try:
        # 1. Save the uploaded image to the temporary file path
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Call the Ollama model with the image and the fixed prompt
        print(f"🤖 Analyzing {file.filename} with model '{MODEL_NAME}'...")
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[
                {
                    'role': 'user',
                    'content': INSTRUCTION_PROMPT,
                    'images': [temp_file_path]
                }
            ]
        )
        model_output = response['message']['content']
        print("✅ Analysis complete.")
        print(f"Model response: {model_output}")

        # 3. Return the model's response
        return {"filename": file.filename, "response": model_output}

    except Exception as e:
        # Handle potential errors from the model or file system
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

    finally:
        # 4. Clean up: always remove the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)