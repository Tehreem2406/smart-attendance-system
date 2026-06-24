# models.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, UniqueConstraint
from .database import Base
from datetime import datetime

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer)
    student_username = Column(String, index=True)
    session_id = Column(Integer, index=True)
    timestamp = Column(DateTime, default=datetime.now)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    category = Column(String)
    parent_contact = Column(String, nullable=True)  # WhatsApp number for parents
    email = Column(String, nullable=True)
    reset_code = Column(String, nullable=True)
    reset_expiry = Column(DateTime, nullable=True)

class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    teacher_username = Column(String, index=True)

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, index=True)
    student_username = Column(String, index=True)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, index=True)
    code = Column(String, unique=True, index=True)
    active = Column(Boolean, default=True)
    start_time = Column(DateTime, default=datetime.now)
    meeting_url = Column(String, nullable=True)

class Mark(Base):
    __tablename__ = "marks"
    id = Column(Integer, primary_key=True, index=True)
    student_username = Column(String, index=True)
    class_id = Column(Integer, index=True)
    type = Column(String)
    item_no = Column(Integer, nullable=True)
    score = Column(Integer)
    total = Column(Integer)
    
    # Add unique constraint to prevent duplicate marks for same student/class/type/item_no
    __table_args__ = (
        UniqueConstraint('student_username', 'class_id', 'type', 'item_no', name='_mark_uc'),
    )

class FeeStructure(Base):
    __tablename__ = "fee_structures"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), index=True)
    fee_amount = Column(Integer, nullable=False)
    discount_percentage = Column(Integer, default=0)
    month = Column(String)
    due_date = Column(String)

class Voucher(Base):
    __tablename__ = "vouchers"
    id = Column(Integer, primary_key=True, index=True)
    student_username = Column(String, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), index=True)
    challan_no = Column(String, unique=True, index=True)
    base_amount = Column(Integer, nullable=False)
    discount_amount = Column(Integer, default=0)
    total_amount = Column(Integer, nullable=False)
    month = Column(String)
    due_date = Column(String)
    status = Column(String, default="unpaid") # paid, unpaid
    created_at = Column(DateTime, default=datetime.now)

class Salary(Base):
    __tablename__ = "salaries"
    id = Column(Integer, primary_key=True, index=True)
    teacher_username = Column(String, index=True)
    amount = Column(Integer, nullable=False)
    status = Column(String, default="unpaid") # paid, unpaid
    month = Column(String)
    created_at = Column(DateTime, default=datetime.now)

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), index=True)
    topic = Column(String, index=True)
    total_marks = Column(Integer)
    due_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), index=True)
    student_username = Column(String, index=True)
    file_path = Column(String)
    submitted_at = Column(DateTime, default=datetime.now)
    ai_score = Column(Integer, nullable=True) # Percentage
    word_count = Column(Integer, nullable=True)
    paste_count = Column(Integer, nullable=True)

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.now)
    type = Column(String, index=True) # fee_payment, salary_payment, expense, discount, other
    description = Column(String)
    debit = Column(Integer, default=0)
    credit = Column(Integer, default=0)
    reference_id = Column(Integer, nullable=True) # ID of voucher/salary for linking
    reference_type = Column(String, nullable=True) # voucher, salary
    related_user = Column(String, index=True, nullable=True) # student/teacher username
    created_by = Column(String, nullable=True) # who created this entry
    created_at = Column(DateTime, default=datetime.now)
    attachment_url = Column(String, nullable=True) # URL/path to receipt/attachment

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True, unique=True) # e.g., office_supplies, utilities
    limit_amount = Column(Integer) # Budget limit
    current_spent = Column(Integer, default=0)
    month = Column(Integer) # 1-12
    year = Column(Integer)
    created_at = Column(DateTime, default=datetime.now)
