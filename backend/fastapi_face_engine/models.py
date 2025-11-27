# models.py
from sqlalchemy import Column, Integer, String, DateTime
from database import Base
from datetime import datetime

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
