# crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Student Functions
def create_student(db: Session, student: schemas.StudentCreate):
    db_student = models.Student(name=student.name)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

def mark_attendance(db: Session, student_id: int):
    db_attendance = models.Attendance(student_id=student_id, timestamp=datetime.now())
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def get_students(db: Session):
    return db.query(models.Student).all()

# User Functions
def create_user(db: Session, user: schemas.UserCreate):
    # truncate password to 72 bytes (bcrypt limit) and encode
    safe_password = user.password.encode("utf-8")[:72]
    hashed_password = pwd_context.hash(safe_password)
    db_user = models.User(
        username=user.username, 
        password=hashed_password, 
        category=user.category,
        email=user.email,
        parent_contact=user.parent_contact
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        return False
    safe_password = password.encode("utf-8")[:72]
    if not pwd_context.verify(safe_password, user.password):
        return False
    return user

def update_user_password(db: Session, user: models.User, new_password: str):
    safe_password = new_password.encode("utf-8")[:72]
    user.password = pwd_context.hash(safe_password)
    db.commit()
    return user

# Ledger Functions
def create_ledger_entry(db: Session, ledger_entry: schemas.LedgerEntryCreate):
    db_ledger = models.LedgerEntry(
        type=ledger_entry.type,
        description=ledger_entry.description,
        debit=ledger_entry.debit,
        credit=ledger_entry.credit,
        reference_id=ledger_entry.reference_id,
        reference_type=ledger_entry.reference_type,
        related_user=ledger_entry.related_user,
        created_by=ledger_entry.created_by,
        attachment_url=ledger_entry.attachment_url
    )
    db.add(db_ledger)
    db.commit()
    db.refresh(db_ledger)
    return db_ledger

def get_ledger_entries(db: Session, skip: int = 0, limit: int = 100, related_user: str | None = None, type: str | None = None):
    query = db.query(models.LedgerEntry)
    if related_user:
        query = query.filter(models.LedgerEntry.related_user == related_user)
    if type:
        query = query.filter(models.LedgerEntry.type == type)
    return query.order_by(models.LedgerEntry.date.desc()).offset(skip).limit(limit).all()

def getLedgerStats(db: Session):
    entries = db.query(models.LedgerEntry).all();
    total_debit = sum(e.debit for e in entries);
    total_credit = sum(e.credit for e in entries);
    return {"total_debit": total_debit, "total_credit": total_credit, "balance": total_credit - total_debit};

def updateLedgerEntry(db: Session, entry_id: int, entry: schemas.LedgerEntryCreate):
    db_entry = db.query(models.LedgerEntry).filter(models.LedgerEntry.id == entry_id).first();
    if not db_entry:
        return None;
    for key, value in entry.dict(exclude_unset=True).items():
        setattr(db_entry, key, value);
    db.commit();
    db.refresh(db_entry);
    return db_entry;

def deleteLedgerEntry(db: Session, entry_id: int):
    db_entry = db.query(models.LedgerEntry).filter(models.LedgerEntry.id == entry_id).first();
    if db_entry:
        # Decrement budget if it's an expense
        if db_entry.debit > 0:
            budget = db.query(models.Budget).filter(
                models.Budget.category == db_entry.type,
                models.Budget.month == db_entry.date.month,
                models.Budget.year == db_entry.date.year
            ).first()
            if budget:
                budget.current_spent -= db_entry.debit
        db.delete(db_entry);
        db.commit();
        return True;
    return False;

# Budget Functions
def createBudget(db: Session, budget: schemas.BudgetCreate):
    db_budget = models.Budget(**budget.dict())
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def getBudgets(db: Session, month: int = None, year: int = None):
    query = db.query(models.Budget)
    if month:
        query = query.filter(models.Budget.month == month)
    if year:
        query = query.filter(models.Budget.year == year)
    return query.all()

def updateBudget(db: Session, budget_id: int, budget: schemas.BudgetUpdate):
    db_budget = db.query(models.Budget).filter(models.Budget.id == budget_id).first()
    if not db_budget:
        return None
    for key, value in budget.dict(exclude_unset=True).items():
        setattr(db_budget, key, value)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def deleteBudget(db: Session, budget_id: int):
    db_budget = db.query(models.Budget).filter(models.Budget.id == budget_id).first()
    if db_budget:
        db.delete(db_budget)
        db.commit()
        return True
    return False

# Update budget when adding an expense
def updateBudgetOnEntry(db: Session, entry: models.LedgerEntry, old_entry: models.LedgerEntry = None):
    if entry.debit > 0:
        # Get or create budget for this category/month/year
        budget = db.query(models.Budget).filter(
            models.Budget.category == entry.type,
            models.Budget.month == entry.date.month,
            models.Budget.year == entry.date.year
        ).first()
        
        if budget:
            # If editing, subtract old amount first
            if old_entry and old_entry.debit > 0:
                budget.current_spent -= old_entry.debit
            budget.current_spent += entry.debit
            db.commit()
