import requests

with open("me.jpg", "rb") as f:
    files = {'file': ("me.jpg", f, "image/jpeg")}
    response = requests.post("http://127.0.0.1:8000/detect-emotion", files=files)

print(response.json())
