# backend/fastapi_face_engine/database.py

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker
import os

# Database file path
DB_PATH = os.path.join(os.path.dirname(__file__), "attendance.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# SQLAlchemy engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)

# Base class for models
Base = declarative_base()

# Admin model
class Admin(Base):
    __tablename__ = "admin"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
