from fastapi import APIRouter, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models, schemas, crud
import uuid
from datetime import datetime, timedelta
import time
import random
import os
import shutil
import smtplib
from email.message import EmailMessage
from typing import Optional, List, Dict
import csv
from io import StringIO
from fastapi import Response
from fastapi.responses import FileResponse
import PyPDF2
import re

router = APIRouter()

def _normalize_meeting_url(s: str | None) -> str | None:
    if not s:
        return None
    t = s.strip()
    if not t:
        return None
    if t.isdigit():
        return f"https://zoom.us/j/{t}"
    return t
def send_reset_email(to_email: str, code: str):
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASS")
    sender = os.getenv("FROM_EMAIL", user or "")
    if not host or not sender:
        return False
    msg = EmailMessage()
    msg["Subject"] = "Your Password Reset Code"
    msg["From"] = sender
    msg["To"] = to_email
    msg.set_content(f"Use this code to reset your password: {code}")
    try:
        with smtplib.SMTP(host, port) as smtp:
            smtp.starttls()
            if user and password:
                smtp.login(user, password)
            smtp.send_message(msg)
        return True
    except Exception:
        return False

@router.get("/users")
def list_users():
    db: Session = SessionLocal()
    try:
        return db.query(models.User).all()
    finally:
        db.close()

@router.post("/login")
def login(payload: schemas.UserCreate):
    db: Session = SessionLocal()
    try:
        user = crud.authenticate_user(db, payload.username, payload.password)
        if not user or user.category != payload.category:
            raise HTTPException(status_code=400, detail="Invalid credentials")
        return {"access_token": uuid.uuid4().hex, "username": user.username, "category": user.category}
    finally:
        db.close()

@router.post("/users")
def create_user(user: schemas.UserCreate):
    db: Session = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.username == user.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
        new_user = crud.create_user(db, user)
        return new_user
    finally:
        db.close()

@router.post("/users/email")
def set_user_email(payload: schemas.EmailUpdate):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == payload.username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.category == "student":
            raise HTTPException(status_code=400, detail="Students cannot have email in system")
        user.email = payload.email
        db.commit()
        return {"updated": True, "username": user.username, "email": user.email}
    finally:
        db.close()

@router.post("/users/contact")
def set_user_contact(payload: schemas.ContactUpdate):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == payload.username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.category != "student":
            raise HTTPException(status_code=400, detail="Only students can have parent contact")
        user.parent_contact = payload.parent_contact
        db.commit()
        return {"updated": True, "username": user.username, "parent_contact": user.parent_contact}
    finally:
        db.close()

@router.post("/password/reset-request")
def password_reset_request(payload: schemas.PasswordResetRequest):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == payload.username).first()
        if not user or user.category != payload.category:
            raise HTTPException(status_code=404, detail="User not found")
        if user.category == "student":
            raise HTTPException(status_code=400, detail="Students must contact admin to reset")
        if not user.email:
            raise HTTPException(status_code=400, detail="Email not set for user")
        if payload.email and payload.email != user.email:
            raise HTTPException(status_code=400, detail="Email does not match")
        code = f"{random.randint(100000, 999999)}"
        user.reset_code = code
        user.reset_expiry = datetime.now() + timedelta(minutes=15)
        db.commit()
        ok = send_reset_email(user.email, code)
        resp = {"sent": ok}
        if not ok:
            resp["dev_code"] = code
        return resp
    finally:
        db.close()

@router.post("/password/reset")
def password_reset_confirm(payload: schemas.PasswordResetConfirm):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == payload.username).first()
        if not user or user.category != payload.category:
            raise HTTPException(status_code=404, detail="User not found")
        if user.category == "student":
            raise HTTPException(status_code=400, detail="Students must contact admin to reset")
        if not user.reset_code or not user.reset_expiry:
            raise HTTPException(status_code=400, detail="No reset requested")
        if user.reset_code != payload.code:
            raise HTTPException(status_code=400, detail="Invalid reset code")
        if datetime.now() > user.reset_expiry:
            raise HTTPException(status_code=400, detail="Reset code expired")
        crud.update_user_password(db, user, payload.new_password)
        user.reset_code = None
        user.reset_expiry = None
        db.commit()
        return {"reset": True}
    finally:
        db.close()
 
@router.post("/password/verify")
def password_reset_verify(payload: schemas.PasswordResetVerify):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == payload.username).first()
        if not user or user.category != payload.category:
            raise HTTPException(status_code=404, detail="User not found")
        if user.category == "student":
            raise HTTPException(status_code=400, detail="Students must contact admin to reset")
        if not user.reset_code or not user.reset_expiry:
            raise HTTPException(status_code=400, detail="No reset requested")
        if user.reset_code != payload.code:
            raise HTTPException(status_code=400, detail="Invalid reset code")
        if datetime.now() > user.reset_expiry:
            raise HTTPException(status_code=400, detail="Reset code expired")
        return {"valid": True}
    finally:
        db.close()
@router.delete("/users/{user_id}")
def delete_user(user_id: int):
    db: Session = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.category == "admin":
            raise HTTPException(status_code=403, detail="Cannot delete admin user")
        db.delete(user)
        db.commit()
        return {"deleted": True, "user_id": user_id}
    finally:
        db.close()

@router.get("/classes")
def list_classes():
    db: Session = SessionLocal()
    try:
        return db.query(models.Class).all()
    finally:
        db.close()

@router.post("/classes")
def create_class(cls: schemas.ClassCreate):
    db: Session = SessionLocal()
    try:
        new_class = models.Class(name=cls.name, teacher_username=cls.teacher_username)
        db.add(new_class)
        db.commit()
        db.refresh(new_class)
        return new_class
    finally:
        db.close()

@router.post("/enrollments")
def enroll_student(enroll: schemas.EnrollmentCreate):
    db: Session = SessionLocal()
    try:
        new_enroll = models.Enrollment(class_id=enroll.class_id, student_username=enroll.student_username)
        db.add(new_enroll)
        db.commit()
        db.refresh(new_enroll)
        return new_enroll
    finally:
        db.close()

@router.get("/enrollments")
def list_enrollments():
    db: Session = SessionLocal()
    try:
        return db.query(models.Enrollment).all()
    finally:
        db.close()

@router.get("/classes/{class_id}/students")
def class_students(class_id: int):
    db: Session = SessionLocal()
    try:
        return db.query(models.Enrollment).filter(models.Enrollment.class_id == class_id).all()
    finally:
        db.close()

@router.post("/sessions/create")
def create_session(payload: schemas.SessionCreate):
    db: Session = SessionLocal()
    try:
        existing_active = db.query(models.Session).filter(models.Session.class_id == payload.class_id, models.Session.active == True).first()
        if existing_active:
            if payload.meeting_url:
                existing_active.meeting_url = _normalize_meeting_url(payload.meeting_url)
                db.commit()
                db.refresh(existing_active)
            return existing_active
        code = uuid.uuid4().hex
        new_sess = models.Session(class_id=payload.class_id, code=code, active=True, meeting_url=_normalize_meeting_url(payload.meeting_url))
        db.add(new_sess)
        db.commit()
        db.refresh(new_sess)
        return new_sess
    finally:
        db.close()

@router.get("/sessions/active/{class_id}")
def get_active_session(class_id: int):
    db: Session = SessionLocal()
    try:
        sess = db.query(models.Session).filter(models.Session.class_id == class_id, models.Session.active == True).first()
        if not sess:
            raise HTTPException(status_code=404, detail="No active session")
        return sess
    finally:
        db.close()

@router.post("/sessions/join")
def join_session(payload: schemas.JoinSession):
    db: Session = SessionLocal()
    try:
        sess = db.query(models.Session).filter(models.Session.code == payload.code, models.Session.active == True).first()
        if not sess:
            raise HTTPException(status_code=404, detail="Invalid session code")
        existing = db.query(models.Attendance).filter(
            models.Attendance.session_id == sess.id,
            models.Attendance.student_username == payload.student_username
        ).first()
        if existing:
            return {"joined": True, "attendance_id": existing.id, "meeting_url": sess.meeting_url}
        att = models.Attendance(student_id=0, student_username=payload.student_username, session_id=sess.id)
        db.add(att)
        db.commit()
        db.refresh(att)
        return {"joined": True, "attendance_id": att.id, "meeting_url": sess.meeting_url}
    finally:
        db.close()

@router.post("/marks")
def add_mark(mark: schemas.MarkCreate):
    db: Session = SessionLocal()
    try:
        new_mark = models.Mark(
            student_username=mark.student_username,
            class_id=mark.class_id,
            type=mark.type,
            item_no=mark.item_no,
            score=mark.score,
            total=mark.total
        )
        db.add(new_mark)
        db.commit()
        db.refresh(new_mark)
        return new_mark
    finally:
        db.close()

@router.get("/marks/{student_username}")
def list_marks(student_username: str):
    db: Session = SessionLocal()
    try:
        return db.query(models.Mark).filter(models.Mark.student_username == student_username).all()
    finally:
        db.close()
 
@router.delete("/classes/{class_id}/marks")
def delete_class_marks(class_id: int):
    db: Session = SessionLocal()
    try:
        db.query(models.Mark).filter(models.Mark.class_id == class_id).delete()
        db.commit()
        return {"deleted": True, "class_id": class_id}
    finally:
        db.close()

@router.get("/attendance/{student_username}")
def list_attendance(student_username: str):
    db: Session = SessionLocal()
    try:
        return db.query(models.Attendance).filter(models.Attendance.student_username == student_username).all()
    finally:
        db.close()

@router.get("/student/{username}/classes")
def student_classes(username: str):
    db: Session = SessionLocal()
    try:
        enrolls = db.query(models.Enrollment).filter(models.Enrollment.student_username == username).all()
        class_ids = [e.class_id for e in enrolls]
        if not class_ids:
            return []
        classes = db.query(models.Class).filter(models.Class.id.in_(class_ids)).all()
        return classes
    finally:
        db.close()

@router.get("/student/{username}/active-session")
def student_active_session(username: str):
    db: Session = SessionLocal()
    try:
        enrolls = db.query(models.Enrollment).filter(models.Enrollment.student_username == username).all()
        class_ids = [e.class_id for e in enrolls]
        if not class_ids:
            raise HTTPException(status_code=404, detail="No classes for student")
        sess = db.query(models.Session).filter(models.Session.class_id.in_(class_ids), models.Session.active == True).first()
        if not sess:
            raise HTTPException(status_code=404, detail="No active session for student")
        return sess
    finally:
        db.close()

@router.post("/sessions/end")
def end_session(payload: schemas.SessionCreate):
    db: Session = SessionLocal()
    try:
        sess = db.query(models.Session).filter(models.Session.class_id == payload.class_id, models.Session.active == True).first()
        if not sess:
            raise HTTPException(status_code=404, detail="No active session for class")
        sess.active = False
        db.commit()
        return {"ended": True, "session_id": sess.id}
    finally:
        db.close()

@router.get("/sessions/{session_id}/attendance")
def session_attendance(session_id: int):
    db: Session = SessionLocal()
    try:
        return db.query(models.Attendance).filter(models.Attendance.session_id == session_id).order_by(models.Attendance.timestamp.desc()).all()
    finally:
        db.close()

@router.post("/fee_structures")
def create_fee_structure(fs: schemas.FeeStructureCreate):
    db: Session = SessionLocal()
    try:
        # Check if fee structure already exists for this class
        existing = db.query(models.FeeStructure).filter(models.FeeStructure.class_id == fs.class_id).first()
        if existing:
            existing.fee_amount = fs.fee_amount
            existing.discount_percentage = fs.discount_percentage
            existing.month = fs.month
            existing.due_date = fs.due_date
            db.commit()
            db.refresh(existing)
            new_fs = existing
        else:
            new_fs = models.FeeStructure(
                class_id=fs.class_id, 
                fee_amount=fs.fee_amount, 
                discount_percentage=fs.discount_percentage,
                month=fs.month,
                due_date=fs.due_date
            )
            db.add(new_fs)
            db.commit()
            db.refresh(new_fs)
        
        # Automatically generate vouchers for all students in this class
        enrollments = db.query(models.Enrollment).filter(models.Enrollment.class_id == fs.class_id).all()
        for enroll in enrollments:
            # Check if voucher already exists for this student and class (unpaid) for THIS month
            existing_voucher = db.query(models.Voucher).filter(
                models.Voucher.student_username == enroll.student_username,
                models.Voucher.class_id == fs.class_id,
                models.Voucher.month == fs.month,
                models.Voucher.status == "unpaid"
            ).first()

            discount_val = int(fs.fee_amount * (fs.discount_percentage / 100))
            total_val = fs.fee_amount - discount_val

            if existing_voucher:
                existing_voucher.base_amount = fs.fee_amount
                existing_voucher.discount_amount = discount_val
                existing_voucher.total_amount = total_val
                existing_voucher.due_date = fs.due_date
            else:
                # Generate unique challan number: CHN-CLASSID-STUDENT-TIMESTAMP-RANDOM
                ts = int(time.time())
                rnd = random.randint(100, 999)
                challan_no = f"CHN-{fs.class_id}-{enroll.student_username[:3].upper()}-{ts}-{rnd}"
                
                voucher = models.Voucher(
                    student_username=enroll.student_username,
                    class_id=fs.class_id,
                    challan_no=challan_no,
                    base_amount=fs.fee_amount,
                    discount_amount=discount_val,
                    total_amount=total_val,
                    month=fs.month,
                    due_date=fs.due_date,
                    status="unpaid"
                )
                db.add(voucher)
        db.commit()
        return new_fs
    finally:
        db.close()

@router.get("/fee_structures")
def list_fee_structures():
    db: Session = SessionLocal()
    try:
        return db.query(models.FeeStructure).all()
    finally:
        db.close()

@router.post("/salaries")
def create_salary(salary: schemas.SalaryCreate):
    db: Session = SessionLocal()
    try:
        new_salary = models.Salary(
            teacher_username=salary.teacher_username,
            amount=salary.amount,
            month=salary.month,
            status="unpaid"
        )
        db.add(new_salary)
        db.commit()
        db.refresh(new_salary)
        return new_salary
    finally:
        db.close()

@router.get("/salaries")
def list_salaries():
    db: Session = SessionLocal()
    try:
        return db.query(models.Salary).all()
    finally:
        db.close()

@router.get("/vouchers")
def list_vouchers(student_username: Optional[str] = None, class_id: Optional[int] = None):
    db: Session = SessionLocal()
    try:
        q = db.query(models.Voucher)
        if student_username:
            q = q.filter(models.Voucher.student_username == student_username)
        if class_id:
            q = q.filter(models.Voucher.class_id == class_id)
        return q.all()
    finally:
        db.close()

@router.patch("/vouchers/{voucher_id}/status")
def update_voucher_status(voucher_id: int, payload: schemas.StatusUpdate):
    db: Session = SessionLocal()
    try:
        v = db.query(models.Voucher).filter(models.Voucher.id == voucher_id).first()
        if not v:
            raise HTTPException(status_code=404, detail="Voucher not found")
        old_status = v.status
        v.status = payload.status
        
        # Auto create ledger entry if voucher is marked as paid (and wasn't before)
        if old_status != "paid" and payload.status == "paid":
            ledger_entry = schemas.LedgerEntryCreate(
                type="fee_payment",
                description=f"Fee Payment - {v.student_username} ({v.month})",
                credit=v.total_amount,
                debit=0,
                reference_id=v.id,
                reference_type="voucher",
                related_user=v.student_username
            )
            crud.create_ledger_entry(db, ledger_entry)
        
        db.commit()
        return {"updated": True, "voucher_id": v.id, "status": v.status}
    finally:
        db.close()

@router.patch("/salaries/{salary_id}/status")
def update_salary_status(salary_id: int, payload: schemas.StatusUpdate):
    db: Session = SessionLocal()
    try:
        s = db.query(models.Salary).filter(models.Salary.id == salary_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Salary record not found")
        old_status = s.status
        s.status = payload.status
        
        # Auto create ledger entry if salary is marked as paid (and wasn't before)
        if old_status != "paid" and payload.status == "paid":
            ledger_entry = schemas.LedgerEntryCreate(
                type="salary_payment",
                description=f"Salary Payment - {s.teacher_username} ({s.month})",
                debit=s.amount,
                credit=0,
                reference_id=s.id,
                reference_type="salary",
                related_user=s.teacher_username
            )
            crud.create_ledger_entry(db, ledger_entry)
        
        db.commit()
        return {"updated": True, "salary_id": s.id, "status": s.status}
    finally:
        db.close()

@router.get("/classes/{class_id}/attendance_records")
def class_attendance_records(class_id: int):
    db: Session = SessionLocal()
    try:
        sessions = db.query(models.Session).filter(models.Session.class_id == class_id).all()
        session_ids = [s.id for s in sessions]
        if not session_ids:
            return []
        return db.query(models.Attendance).filter(models.Attendance.session_id.in_(session_ids)).order_by(models.Attendance.timestamp.desc()).all()
    finally:
        db.close()

@router.get("/reports/attendance")
def attendance_report(class_id: Optional[int] = None, month: Optional[str] = None):
    db: Session = SessionLocal()
    try:
        q = db.query(models.Attendance, models.Session, models.Class)\
            .join(models.Session, models.Attendance.session_id == models.Session.id)\
            .join(models.Class, models.Session.class_id == models.Class.id)
        if class_id:
            q = q.filter(models.Class.id == class_id)
        if month:
            try:
                parts = month.split("-")
                year = int(parts[0]); mon = int(parts[1])
                start = datetime(year, mon, 1)
                if mon == 12:
                    end = datetime(year + 1, 1, 1)
                else:
                    end = datetime(year, mon + 1, 1)
                q = q.filter(models.Attendance.timestamp >= start, models.Attendance.timestamp < end)
            except Exception:
                pass
        rows = q.order_by(models.Attendance.timestamp.desc()).all()
        result: List[Dict] = []
        for att, sess, cls in rows:
            result.append({
                "id": att.id,
                "student": att.student_username,
                "class": cls.name,
                "date": att.timestamp.strftime("%Y-%m-%d"),
                "status": "Present"
            })
        return result
    finally:
        db.close()

@router.get("/reports/attendance/export")
def attendance_report_export(class_id: Optional[int] = None, month: Optional[str] = None):
    # Reuse logic by calling the function directly
    data = attendance_report(class_id=class_id, month=month)  # type: ignore
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Student", "Class", "Date", "Status"])
    for row in data:  # type: ignore
        writer.writerow([row["id"], row["student"], row["class"], row["date"], row["status"]])
    csv_bytes = output.getvalue()
    return Response(content=csv_bytes, media_type="text/csv")

@router.post("/assignments")
def create_assignment(payload: schemas.AssignmentCreate):
    db: Session = SessionLocal()
    try:
        due_dt = datetime.fromisoformat(payload.due_date.replace("Z", "+00:00"))
        new_assign = models.Assignment(
            class_id=payload.class_id,
            topic=payload.topic,
            total_marks=payload.total_marks,
            due_date=due_dt
        )
        db.add(new_assign)
        db.commit()
        db.refresh(new_assign)
        return new_assign
    finally:
        db.close()

@router.get("/classes/{class_id}/assignments")
def list_assignments(class_id: int):
    db: Session = SessionLocal()
    try:
        return db.query(models.Assignment).filter(models.Assignment.class_id == class_id).all()
    finally:
        db.close()

@router.post("/assignments/{assignment_id}/submit")
def submit_assignment(assignment_id: int, student_username: str, file: UploadFile = File(...)):
    db: Session = SessionLocal()
    try:
        assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        
        # Save file
        upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        file_ext = os.path.splitext(file.filename or "")[1]
        if file_ext.lower() != ".pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        file_name = f"{assignment_id}_{student_username}_{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(upload_dir, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        new_sub = models.AssignmentSubmission(
            assignment_id=assignment_id,
            student_username=student_username,
            file_path=file_name
        )
        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)
        return new_sub
    finally:
        db.close()

@router.get("/assignments/{assignment_id}/submissions")
def list_submissions(assignment_id: int):
    db: Session = SessionLocal()
    try:
        return db.query(models.AssignmentSubmission).filter(models.AssignmentSubmission.assignment_id == assignment_id).all()
    finally:
        db.close()

@router.get("/classes/{class_id}/submissions")
def list_class_submissions(class_id: int):
    db: Session = SessionLocal()
    try:
        # Join Assignment and AssignmentSubmission to get all submissions for a class
        return db.query(models.AssignmentSubmission)\
            .join(models.Assignment, models.AssignmentSubmission.assignment_id == models.Assignment.id)\
            .filter(models.Assignment.class_id == class_id).all()
    finally:
        db.close()

@router.get("/submissions/{submission_id}/download")
def download_submission(submission_id: int):
    db: Session = SessionLocal()
    try:
        sub = db.query(models.AssignmentSubmission).filter(models.AssignmentSubmission.id == submission_id).first()
        if not sub:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        file_path = os.path.join(os.path.dirname(__file__), "uploads", sub.file_path)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on server")
            
        return FileResponse(path=file_path, filename=sub.file_path, media_type="application/pdf")
    finally:
        db.close()

@router.post("/marks")
def create_or_update_mark(payload: schemas.MarkCreate):
    db: Session = SessionLocal()
    try:
        # If item_no is provided, check if we're updating an existing mark
        if payload.item_no is not None:
            existing_mark = db.query(models.Mark).filter(
                models.Mark.student_username == payload.student_username,
                models.Mark.class_id == payload.class_id,
                models.Mark.type == payload.type,
                models.Mark.item_no == payload.item_no
            ).first()

            if existing_mark:
                existing_mark.score = payload.score
                existing_mark.total = payload.total
                db.commit()
                db.refresh(existing_mark)
                return existing_mark
        
        # If we're creating a new mark, use a transaction with row locking to prevent race conditions
        while True:
            try:
                # Start a transaction
                db.begin()
                
                # Lock the rows when querying to prevent other transactions from reading them at the same time
                existing_marks = db.query(models.Mark).filter(
                    models.Mark.class_id == payload.class_id,
                    models.Mark.type == payload.type
                ).with_for_update().all()
                
                if not existing_marks:
                    next_item_no = 1
                else:
                    max_item = max(m.item_no for m in existing_marks if m.item_no is not None)
                    next_item_no = max_item + 1
                
                new_mark = models.Mark(
                    student_username=payload.student_username,
                    class_id=payload.class_id,
                    type=payload.type,
                    item_no=next_item_no,
                    score=payload.score,
                    total=payload.total
                )
                db.add(new_mark)
                db.commit()
                db.refresh(new_mark)
                return new_mark
            except Exception as e:
                db.rollback()
                # If we hit a unique constraint violation (race condition), try again!
                if "UNIQUE constraint failed" in str(e) or "Duplicate entry" in str(e):
                    continue
                # For other errors, re-raise
                raise
    finally:
        db.close()

@router.get("/classes/{class_id}/marks/next-item-no")
def get_next_item_no(class_id: int, type: str):
    db: Session = SessionLocal()
    try:
        # Use row locking for consistency
        existing_marks = db.query(models.Mark).filter(
            models.Mark.class_id == class_id,
            models.Mark.type == type
        ).with_for_update().all()
        
        if not existing_marks:
            return {"next_item_no": 1}
        else:
            max_item = max(m.item_no for m in existing_marks if m.item_no is not None)
            return {"next_item_no": max_item + 1}
    finally:
        db.close()

@router.get("/classes/{class_id}/marks")
def list_class_marks(class_id: int):
    db: Session = SessionLocal()
    try:
        return db.query(models.Mark).filter(models.Mark.class_id == class_id).all()
    finally:
        db.close()

@router.get("/students/{username}/marks")
def list_student_marks(username: str):
    db: Session = SessionLocal()
    try:
        return db.query(models.Mark).filter(models.Mark.student_username == username).all()
    finally:
        db.close()

@router.delete("/marks/{mark_id}")
def delete_mark(mark_id: int):
    db: Session = SessionLocal()
    try:
        mark = db.query(models.Mark).filter(models.Mark.id == mark_id).first()
        if not mark:
            raise HTTPException(status_code=404, detail="Mark record not found")
        db.delete(mark)
        db.commit()
        return {"deleted": True, "id": mark_id}
    finally:
        db.close()

@router.get("/finance/dashboard/stats")
def get_finance_dashboard_stats():
    db: Session = SessionLocal()
    try:
        # Total Revenue (Sum of all paid vouchers)
        total_revenue = db.query(models.Voucher).filter(models.Voucher.status == "paid").with_entities(models.Voucher.total_amount).all()
        revenue_sum = sum(v[0] for v in total_revenue)
        
        # Pending Fees (Sum of all unpaid vouchers)
        pending_fees = db.query(models.Voucher).filter(models.Voucher.status == "unpaid").with_entities(models.Voucher.total_amount).all()
        pending_sum = sum(v[0] for v in pending_fees)
        
        # Paid Students (Count of unique students who have at least one paid voucher)
        paid_students = db.query(models.Voucher).filter(models.Voucher.status == "paid").distinct(models.Voucher.student_username).count()
        
        # Late Payments (Count of unpaid vouchers past their due date)
        today_str = datetime.now().strftime("%Y-%m-%d")
        late_payments = db.query(models.Voucher).filter(
            models.Voucher.status == "unpaid",
            models.Voucher.due_date < today_str
        ).count()
        
        return {
            "total_revenue": revenue_sum,
            "pending_fees": pending_sum,
            "paid_students": paid_students,
            "late_payments": late_payments
        }
    finally:
        db.close()

# Ledger Endpoints
@router.post("/ledger")
def create_ledger_entry(ledger_entry: schemas.LedgerEntryCreate):
    db: Session = SessionLocal()
    try:
        entry = crud.create_ledger_entry(db, ledger_entry)
        # Update budget
        crud.updateBudgetOnEntry(db, entry)
        return entry
    finally:
        db.close()

@router.get("/ledger")
def get_ledger(skip: int = 0, limit: int = 100, related_user: str | None = None, type: str | None = None):
    db: Session = SessionLocal()
    try:
        entries = crud.get_ledger_entries(db, skip, limit, related_user, type)
        # Convert to response format with string dates
        result = []
        for entry in entries:
            result.append({
                "id": entry.id,
                "date": entry.date.isoformat(),
                "type": entry.type,
                "description": entry.description,
                "debit": entry.debit,
                "credit": entry.credit,
                "reference_id": entry.reference_id,
                "reference_type": entry.reference_type,
                "related_user": entry.related_user,
                "created_by": entry.created_by,
                "created_at": entry.created_at.isoformat(),
                "attachment_url": entry.attachment_url
            })
        return result
    finally:
        db.close()

@router.get("/ledger/stats")
def get_ledger_stats():
    db: Session = SessionLocal()
    try:
        return crud.getLedgerStats(db)
    finally:
        db.close()

@router.put("/ledger/{entry_id}")
def update_ledger_entry(entry_id: int, entry: schemas.LedgerEntryCreate):
    db: Session = SessionLocal()
    try:
        old_entry = db.query(models.LedgerEntry).filter(models.LedgerEntry.id == entry_id).first()
        updated = crud.updateLedgerEntry(db, entry_id, entry)
        if not updated:
            raise HTTPException(status_code=404, detail="Entry not found")
        # Update budget
        crud.updateBudgetOnEntry(db, updated, old_entry)
        return updated
    finally:
        db.close()

@router.delete("/ledger/{entry_id}")
def delete_ledger_entry(entry_id: int):
    db: Session = SessionLocal()
    try:
        success = crud.deleteLedgerEntry(db, entry_id)
        if not success:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"success": True}
    finally:
        db.close()

# Budget Endpoints
@router.post("/budgets", response_model=schemas.Budget)
def create_budget(budget: schemas.BudgetCreate):
    db: Session = SessionLocal()
    try:
        return crud.createBudget(db, budget)
    finally:
        db.close()

@router.get("/budgets")
def get_budgets(month: int = None, year: int = None):
    db: Session = SessionLocal()
    try:
        budgets = crud.getBudgets(db, month, year)
        return [
            {
                "id": b.id,
                "category": b.category,
                "limit_amount": b.limit_amount,
                "current_spent": b.current_spent,
                "month": b.month,
                "year": b.year,
                "created_at": b.created_at.isoformat(),
                "percentage_spent": (b.current_spent / b.limit_amount * 100) if b.limit_amount > 0 else 0,
                "is_over_budget": b.current_spent > b.limit_amount
            } for b in budgets
        ]
    finally:
        db.close()

@router.put("/budgets/{budget_id}")
def update_budget(budget_id: int, budget: schemas.BudgetUpdate):
    db: Session = SessionLocal()
    try:
        updated = crud.updateBudget(db, budget_id, budget)
        if not updated:
            raise HTTPException(status_code=404, detail="Budget not found")
        return updated
    finally:
        db.close()

@router.delete("/budgets/{budget_id}")
def delete_budget(budget_id: int):
    db: Session = SessionLocal()
    try:
        success = crud.deleteBudget(db, budget_id)
        if not success:
            raise HTTPException(status_code=404, detail="Budget not found")
        return {"success": True}
    finally:
        db.close()

@router.get("/dashboard/stats")
def get_dashboard_stats():
    db: Session = SessionLocal()
    try:
        total_users = db.query(models.User).count()
        teachers = db.query(models.User).filter(models.User.category == "teacher").count()
        students = db.query(models.User).filter(models.User.category == "student").count()
        
        # Attendance Today
        today = datetime.now().date()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())
        attendance_today = db.query(models.Attendance).filter(
            models.Attendance.timestamp >= start_of_day,
            models.Attendance.timestamp <= end_of_day
        ).count()
        
        return {
            "total_users": total_users,
            "teachers": teachers,
            "students": students,
            "attendance_today": attendance_today
        }
    finally:
        db.close()

import hashlib

@router.post("/submissions/{submission_id}/check")
def check_assignment(submission_id: int):
    db: Session = SessionLocal()
    try:
        sub = db.query(models.AssignmentSubmission).filter(models.AssignmentSubmission.id == submission_id).first()
        if not sub:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        file_path = os.path.join(os.path.dirname(__file__), "uploads", sub.file_path)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        # Process PDF
        text = ""
        try:
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

        # Deterministic Analysis based on Content Hash
        # This ensures the same content always gives the same result
        content_hash = hashlib.md5(text.encode()).hexdigest()
        hash_seed = int(content_hash[:8], 16)
        
        # 1. Word Count
        words = re.findall(r'\w+', text)
        word_count = len(words)

        if word_count < 10:
            sub.ai_score = 0
            sub.word_count = word_count
            sub.paste_count = 0
            db.commit()
            return {"id": sub.id, "ai_score": 0, "word_count": word_count, "paste_count": 0, "status": "Checked (Too short)"}

        # 2. Sophisticated AI Detection Simulation
        # AI often uses specific transition patterns and formal structure
        ai_markers = [
            "furthermore", "moreover", "in conclusion", "additionally", "nevertheless", 
            "consequently", "significant", "crucial", "fundamental", "pivotal",
            "essentially", "ultimately", "it is worth noting", "on the other hand",
            "in terms of", "with respect to", "facilitates", "leverages", "comprehensive"
        ]
        
        marker_count = sum(1 for word in words if word.lower() in ai_markers)
        
        # Calculate marker density
        density = marker_count / max(1, word_count)
        
        # Base score on density (scaled)
        # 0.02 density (2%) is quite high for these specific words in natural writing
        base_ai_score = min(98, (density * 2500)) 
        
        # Add deterministic "fuzz" based on hash
        fuzz = (hash_seed % 15) - 7 # -7 to +7
        ai_score = max(0, min(99, base_ai_score + fuzz))

        # Adjust for short texts (less reliable)
        if word_count < 100:
            ai_score = ai_score * (word_count / 100)

        # 3. Paste Count Simulation
        # Simulate detection of large blocks of text pasted from elsewhere
        # We use sentence length variance as a proxy for "pasted" content (AI/Pasted often has very uniform sentence lengths)
        sentences = re.split(r'[.!?]+', text)
        sent_lengths = [len(s.split()) for s in sentences if len(s.split()) > 0]
        
        if len(sent_lengths) > 5:
            avg_len = sum(sent_lengths) / len(sent_lengths)
            variance = sum((l - avg_len)**2 for l in sent_lengths) / len(sent_lengths)
            # Low variance (uniform sentence length) often indicates AI or copy-pasted blocks
            paste_indicator = max(0, 10 - (variance / 10))
            paste_count = int(paste_indicator + (hash_seed % 3))
        else:
            paste_count = hash_seed % 3

        # Update Database
        sub.ai_score = int(ai_score)
        sub.word_count = word_count
        sub.paste_count = paste_count
        db.commit()
        db.refresh(sub)

        return {
            "id": sub.id,
            "ai_score": sub.ai_score,
            "word_count": sub.word_count,
            "paste_count": sub.paste_count,
            "status": "Checked"
        }
    finally:
        db.close()
