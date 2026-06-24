# seed_data.py
from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import crud, models, schemas

# Create tables
models.Base.metadata.create_all(bind=engine)

db: Session = SessionLocal()

# 1. Create Users
users = [
    {"username": "admin", "password": "admin123", "category": "admin"},
    {"username": "teacher1", "password": "teacher123", "category": "teacher"},
    {"username": "student1", "password": "student123", "category": "student"},
    {"username": "student2", "password": "student223", "category": "student"},
    {"username": "finance1", "password": "finance123", "category": "finance"}
]

for u in users:
    if not db.query(models.User).filter(models.User.username == u["username"]).first():
        crud.create_user(db, schemas.UserCreate(**u))
        print(f"User {u['username']} created.")

# 2. Reset and Create Classes
# Clear all existing classes, enrollments, fee structures, and vouchers to ensure only the requested three exist
db.query(models.Voucher).delete()
db.query(models.FeeStructure).delete()
db.query(models.Enrollment).delete()
db.query(models.Class).delete()
db.commit()

classes = [
    {"name": "BSCS", "teacher_username": "teacher1"},
    {"name": "BSPH", "teacher_username": "teacher1"},
    {"name": "BSCH", "teacher_username": "teacher1"}
]

for c in classes:
    new_class = models.Class(name=c["name"], teacher_username=c["teacher_username"])
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    print(f"Class {c['name']} created.")

# 3. Enroll Students
# Get the class IDs
bscs = db.query(models.Class).filter(models.Class.name == "BSCS").first()
bsph = db.query(models.Class).filter(models.Class.name == "BSPH").first()
bsch = db.query(models.Class).filter(models.Class.name == "BSCH").first()

if bscs:
    db.add(models.Enrollment(class_id=bscs.id, student_username="student1"))
    db.add(models.Enrollment(class_id=bscs.id, student_username="student2"))
if bsph:
    db.add(models.Enrollment(class_id=bsph.id, student_username="student1"))
if bsch:
    db.add(models.Enrollment(class_id=bsch.id, student_username="student1"))

db.commit()
db.close()
print("Database reset and seeded with only BSCS, BSPH, and BSCH classes!")
