# main.py
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import crud, models, schemas
from database import SessionLocal, engine
import shutil, os
from face_recognition_utils import recognize_face

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Attendance System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Routes
@app.post("/students/")
def add_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    return crud.create_student(db, student)

@app.get("/students/")
def list_students(db: Session = Depends(get_db)):
    return crud.get_students(db)

@app.post("/attendance/upload/")
def upload_face(file: UploadFile = File(...), db: Session = Depends(get_db)):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Recognize face
    name = recognize_face(file_path)
    if not name:
        raise HTTPException(status_code=404, detail="Face not recognized")

    # Find student by name
    students = crud.get_students(db)
    student = next((s for s in students if s.name == name), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found in database")

    # Mark attendance
    attendance = crud.mark_attendance(db, student.id)
    return {"message": f"Attendance marked for {name}", "attendance": attendance.id}
