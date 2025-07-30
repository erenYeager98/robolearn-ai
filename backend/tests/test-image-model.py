import requests

# The URL of your running FastAPI application
API_URL = "http://127.0.0.1:8004/analyze-image/"

# The path to the image you want to analyze
IMAGE_TO_TEST = "happy.jpg"  # <<< CHANGE THIS

try:
    with open(IMAGE_TO_TEST, "rb") as image_file:
        # The 'files' parameter is used to send multipart/form-data
        files = {"file": (IMAGE_TO_TEST, image_file, "image/png")}
        
        response = requests.post(API_URL, files=files)
        
        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status()
        
        print("✅ Success! Server Response:")
        print(response.json())
        
except FileNotFoundError:
    print(f"❌ Error: The file '{IMAGE_TO_TEST}' was not found.")
except requests.exceptions.RequestException as e:
    print(f"❌ An error occurred while calling the API: {e}")