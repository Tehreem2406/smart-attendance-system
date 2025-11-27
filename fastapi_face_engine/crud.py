# crud.py
from sqlalchemy.orm import Session
import models, schemas
from datetime import datetime

def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(name=student.name)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def mark_attendance(db: Session, student_id: int):
    db_attendance = models.Attendance(student_id=student_id, timestamp=datetime.utcnow())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def get_students(db: Session):
    return db.query(models.Student).all()
