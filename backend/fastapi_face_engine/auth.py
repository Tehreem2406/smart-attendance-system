# backend/fastapi_face_engine/auth.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import bcrypt
from .database import SessionLocal, Admin, Base, engine

router = APIRouter()

# -------------------------
# Pydantic model for login
# -------------------------
class AdminLogin(BaseModel):
    username: str
    password: str

# -------------------------
# Create default admin
# -------------------------
def create_default_admin():
    Base.metadata.create_all(bind=engine)  # Ensure tables exist
    db: Session = SessionLocal()
    try:
        if not db.query(Admin).filter(Admin.username == "admin").first():
            hashed_pw = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt())
            admin = Admin(username="admin", password=hashed_pw.decode())
            db.add(admin)
            db.commit()
            print("Default admin created: username='admin', password='admin123'")
    finally:
        db.close()

# -------------------------
# Login endpoint
# -------------------------
@router.post("/login")
def login(admin: AdminLogin):
    db: Session = SessionLocal()
    try:
        user = db.query(Admin).filter(Admin.username == admin.username).first()
        if not user or not bcrypt.checkpw(admin.password.encode(), user.password.encode()):
            raise HTTPException(status_code=400, detail="Invalid username or password")
        return {"message": "Login successful", "username": user.username}
    finally:
        db.close()
