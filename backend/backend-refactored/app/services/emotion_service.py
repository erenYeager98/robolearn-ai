from fer import FER
import numpy as np
import cv2

def load_detector():
    """Loads the FER model instance."""
    print("Loading FER model...")
    return FER()

def detect_emotion_from_bytes(detector: FER, image_bytes: bytes):
    """Detects emotion from an image provided as bytes."""
    try:
        np_arr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            return {"emotion": None, "score": 0.0, "message": "Invalid image"}

        top_emotion = detector.top_emotion(image)

        if not top_emotion or top_emotion[0] is None:
            return {"emotion": None, "score": 0.0, "message": "No face detected"}

        emotion, score = top_emotion
        return {"emotion": emotion, "score": float(score)}

    except Exception as e:
        print(f"Error during emotion detection: {e}")
        # In a real app, you might return a more specific error
        return {"emotion": "error", "score": 0.0, "message": str(e)}