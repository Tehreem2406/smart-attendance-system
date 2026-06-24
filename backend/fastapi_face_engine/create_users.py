# create_users.py
from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import crud, models, schemas

# Create tables using engine from database.py
models.Base.metadata.create_all(bind=engine)

# Users to create
users = [
    {"username": "admin", "password": "admin123", "category": "admin"},
    {"username": "teacher1", "password": "teacher123", "category": "teacher"},
    {"username": "student1", "password": "student123", "category": "student"},
    {"username": "finance1", "password": "finance123", "category": "finance"}
]

db: Session = SessionLocal()

for u in users:
    existing_user = db.query(models.User).filter(models.User.username == u["username"]).first()
    if not existing_user:
        crud.create_user(db, schemas.UserCreate(**u))

db.close()
print("Users created successfully!")
