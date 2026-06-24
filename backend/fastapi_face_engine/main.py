# backend/fastapi_face_engine/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth import router as auth_router, create_default_admin
from .attendance import router as attendance_router
from .database import SessionLocal
from . import models, crud, schemas
from .database import Base, engine
import os

def _load_env():
    base = os.path.dirname(os.path.abspath(__file__))
    candidates = [os.path.join(base, ".env"), os.path.join(os.path.dirname(base), ".env")]
    for p in candidates:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        s = line.strip()
                        if not s or s.startswith("#"):
                            continue
                        k, v = (s.split("=", 1) + [""])[:2]
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k:
                            os.environ.setdefault(k, v)
            except Exception:
                pass
            break

_load_env()
app = FastAPI(
    title="Smart Attendance System",
    version="1.0.0"
)

# CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Temporarily allow all for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(attendance_router, prefix="/api", tags=["API"])

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Smart Attendance System API is running"}

# Startup: create tables and default admin
@app.on_event("startup")
def startup_event():
    try:
        with engine.connect() as conn:
            cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(sessions)").fetchall()]
            if "meeting_url" not in cols:
                conn.exec_driver_sql("ALTER TABLE sessions ADD COLUMN meeting_url TEXT")
            mark_cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(marks)").fetchall()]
            if "item_no" not in mark_cols:
                conn.exec_driver_sql("ALTER TABLE marks ADD COLUMN item_no INTEGER")
    except Exception:
        pass
    Base.metadata.create_all(bind=engine)
    create_default_admin()
    db = SessionLocal()
    try:
        admin_user = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin_user:
            admin_user = crud.create_user(db, schemas.UserCreate(username="admin", password="admin123", category="admin"))
        
        # Always ensure the admin email is set as requested
        if admin_user.email != "tehreemusman903@gmail.com":
            admin_user.email = "tehreemusman903@gmail.com"
            db.commit()
    finally:
        db.close()
