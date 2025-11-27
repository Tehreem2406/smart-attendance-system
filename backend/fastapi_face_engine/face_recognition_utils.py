# face_recognition_utils.py
import face_recognition
import numpy as np

# Load known faces here (this is just a template)
known_face_encodings = []
known_face_names = []

def recognize_face(uploaded_image_path: str):
    unknown_image = face_recognition.load_image_file(uploaded_image_path)
    unknown_encoding = face_recognition.face_encodings(unknown_image)

    if len(unknown_encoding) == 0:
        return None  # No face detected

    unknown_encoding = unknown_encoding[0]
    results = face_recognition.compare_faces(known_face_encodings, unknown_encoding)
    
    for i, match in enumerate(results):
        if match:
            return known_face_names[i]
    return None
