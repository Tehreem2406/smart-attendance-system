# EduSync Smart Attendance & School Management System

A modern, full-stack school management system with session-based attendance, financial ledger, and comprehensive user role management!

---

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributors](#contributors)

---

## ✨ Features

### 👥 User Roles
- **Admin**: Manage users, classes, and generate reports
- **Teacher**: Create attendance sessions, upload marks, manage assignments
- **Student**: View attendance, marks, fee vouchers, submit assignments
- **Finance Officer**: Manage fees, salaries, financial ledger, budget tracking

### 📊 Core Features
- **Session-Based Attendance**: Start/stop attendance sessions, students join via unique code
- **Financial Ledger**: Track all income/expenses with categories, attachments, and running balance
- **Budget Tracking**: Set monthly category budgets and monitor spending
- **Fee Management**: Create fee structures, generate vouchers, track payments
- **Assignment Management**: Create assignments, collect submissions
- **Marks Management**: Enter marks with auto-generated item numbers
- **Reports**: Export attendance and financial reports

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 14, React, Tailwind CSS |
| **Backend** | FastAPI, SQLAlchemy ORM, SQLite |
| **Authentication** | JWT-based session management |
| **Utilities** | PyPDF2, bcrypt |

---

## 📁 Project Structure

```
smart-attendance-system/
├── backend/
│   ├── fastapi_face_engine/      # FastAPI core backend
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── attendance.py         # API routes for all features
│   │   ├── models.py             # SQLAlchemy models
│   │   ├── schemas.py            # Pydantic schemas
│   │   ├── crud.py               # Database operations
│   │   ├── database.py           # DB connection
│   │   └── seed_data.py          # Sample data
│   ├── django_server/            # Legacy Django (optional)
│   └── run_migration.py          # DB migration script
│
├── frontend/
│   ├── web_app/                  # Next.js 14 app router
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   ├── student/
│   │   │   └── finance/
│   │   └── src/
│   │       ├── services/         # API calls
│   │       └── components/       # Navbar, Sidebar
│
├── docs/                         # SRS and project docs
└── README.md
```

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/[your-username]/smart-attendance-system.git
cd smart-attendance-system
```

### 2. Backend Setup

#### Create Virtual Env
```bash
cd backend
python -m venv venv
```

#### Activate Virtual Env
- Windows:
  ```powershell
  venv\Scripts\activate
  ```
- Linux/Mac:
  ```bash
  source venv/bin/activate
  ```

#### Install Dependencies
```bash
pip install fastapi uvicorn sqlalchemy passlib pydantic python-multipart PyPDF2
```

#### Start the Backend
```bash
python -m uvicorn fastapi_face_engine.main:app --reload
```
The backend server will run on http://127.0.0.1:8000

### 3. Frontend Setup

```bash
cd frontend/web_app
npm install
npm run dev
```
The frontend will run on http://localhost:3000

---

## 📖 Usage

1. **Start the backend** at http://127.0.0.1:8000
2. **Start the frontend** at http://localhost:3000
3. Open your browser and log in!
   - Default admin credentials (can be changed in settings): username `admin`, password `admin123`

---

## 📡 API Documentation

Once the backend is running, visit these URLs for auto-generated documentation:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

---

## 🤝 Contributors
Built with ❤️ by Tehreem Usman and team!

---

## 📄 License
This project is created for educational purposes as part of a Final Year Project (FYP).
