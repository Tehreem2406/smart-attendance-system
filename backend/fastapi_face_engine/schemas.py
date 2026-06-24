# schemas.py
from pydantic import BaseModel
from typing import Optional

# Students
class StudentCreate(BaseModel):
    name: str

# Users
class UserBase(BaseModel):
    username: str
    category: str
    email: Optional[str] = None
    parent_contact: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class EmailUpdate(BaseModel):
    username: str
    email: str

class ContactUpdate(BaseModel):
    username: str
    parent_contact: str
 
class PasswordResetRequest(BaseModel):
    username: str
    category: str
    email: str | None = None
 
class PasswordResetConfirm(BaseModel):
    username: str
    category: str
    code: str
    new_password: str
 
class PasswordResetVerify(BaseModel):
    username: str
    category: str
    code: str

class ClassCreate(BaseModel):
    name: str
    teacher_username: str

class EnrollmentCreate(BaseModel):
    class_id: int
    student_username: str

class SessionCreate(BaseModel):
    class_id: int
    meeting_url: str | None = None

class JoinSession(BaseModel):
    code: str
    student_username: str

class MarkCreate(BaseModel):
    student_username: str
    class_id: int
    type: str
    item_no: int | None = None
    score: int
    total: int

class FeeStructureCreate(BaseModel):
    class_id: int
    fee_amount: int
    discount_percentage: int
    month: str
    due_date: str

class VoucherCreate(BaseModel):
    student_username: str
    class_id: int
    challan_no: str
    base_amount: int
    discount_amount: int
    total_amount: int
    month: str
    due_date: str

class SalaryCreate(BaseModel):
    teacher_username: str
    amount: int
    month: str

class StatusUpdate(BaseModel):
    status: str

class AssignmentCreate(BaseModel):
    class_id: int
    topic: str
    total_marks: int
    due_date: str

class AssignmentResponse(BaseModel):
    id: int
    class_id: int
    topic: str
    total_marks: int
    due_date: str
    created_at: str

    class Config:
        from_attributes = True

class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_username: str
    file_path: str
    submitted_at: str

    class Config:
        from_attributes = True

# Ledger
class LedgerEntryCreate(BaseModel):
    type: str
    description: str
    debit: int = 0
    credit: int = 0
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    related_user: Optional[str] = None
    created_by: Optional[str] = None
    attachment_url: Optional[str] = None

class LedgerEntry(BaseModel):
    id: int
    date: str
    type: str
    description: str
    debit: int
    credit: int
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    related_user: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str
    attachment_url: Optional[str] = None

    class Config:
        from_attributes = True

class LedgerStats(BaseModel):
    total_debit: int
    total_credit: int
    balance: int

# Budget
class BudgetCreate(BaseModel):
    category: str
    limit_amount: int
    month: int
    year: int

class BudgetUpdate(BaseModel):
    limit_amount: Optional[int] = None

class Budget(BaseModel):
    id: int
    category: str
    limit_amount: int
    current_spent: int
    month: int
    year: int
    created_at: str

    class Config:
        from_attributes = True
    
