# Smart Attendance System — FastAPI Backend

A real-time **face recognition–based attendance system** built using **FastAPI**, **Dlib**, **face_recognition**, and **SQLAlchemy ORM**.  
This backend handles user registration, face encoding, attendance marking, and API endpoints for communication with the frontend dashboard.

---

## Features

- **Face Recognition Based Attendance**: Detects faces in live camera feed, generates encodings, matches in real-time, marks attendance automatically.
- **FastAPI Backend**: High-performance API with modular routes & controllers.
- **Database Support**: SQLAlchemy ORM to store user details, face encodings, and attendance history.
- **Media Handling**: Upload and store face images securely.
- **Optional Authentication**: JWT-based secure access.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend API | FastAPI |
| AI / Face Recognition | dlib, face_recognition, numpy |
| Database | SQLite / MySQL / PostgreSQL |
| ORM | SQLAlchemy |
| Server | Uvicorn |

---

## Project Structure

```
smart-attendance-system/
│
├── README.md
├── backend/
│   ├── fastapi_face_engine/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── routers/
│   │   └── utils/
│   └── venv/
├── frontend/  (optional)
└── requirements.txt
```

---

## Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/Tehreem2406/smart-attendance-system.git
cd smart-attendance-system/backend
```

### 2. Create & Activate Virtual Environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux / Mac
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run FastAPI Server
```bash
uvicorn main:app --reload
```
Server: http://127.0.0.1:8000  
Swagger API Docs: http://127.0.0.1:8000/docs  
ReDoc: http://127.0.0.1:8000/redoc

---

## How Face Recognition Works

1. Extract face from image  
2. Generate 128-dimensional encoding  
3. Store encoding in database  
4. During attendance:
   - Process live camera frame  
   - Compare encodings  
   - Mark attendance if matched

---

## Database Tables

### Users Table
- id  
- name  
- roll_no / employee_id  
- image_path  
- face_encoding  

### Attendance Table
- id  
- user_id  
- timestamp  
- status (Present/Absent)

---

## API Endpoints (Examples)

- **POST /upload-face/** → Upload user face  
- **POST /mark-attendance/** → Mark attendance  
- **GET /users/** → Get all users  
- **GET /attendance/** → Attendance report  

---

## Developer 
Built by Tehreem Usman 