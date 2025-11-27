# schemas.py
from pydantic import BaseModel
from datetime import datetime

class StudentCreate(BaseModel):
    name: str

class AttendanceCreate(BaseModel):
    student_id: int
    timestamp: datetime = None
