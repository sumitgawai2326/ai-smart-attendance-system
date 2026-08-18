# AI-Based Smart Attendance Monitoring System

A production-ready **AI-Based Smart Attendance Monitoring System** for college/classroom environments using OpenCV face recognition, anti-spoofing liveness detection, role-based dashboards (Admin, Faculty Teacher, Student), automated attendance marking, duplicate attendance prevention, and Firebase Firestore integration.

---

## Key Features

- **Multi-Role Portals**: Admin, Teacher, and Student Dashboards with role-based routing.
- **AI Face Enrollment**: Multi-sample webcam capture generating 128-dimensional facial embedding templates.
- **Real-Time Camera AI Recognition**: Video frame analysis with face bounding box detection and vector similarity matching.
- **Anti-Spoofing Liveness Verification**: Eye Aspect Ratio (EAR) blink estimation + texture variance analysis to block photo/screen spoofing.
- **Automated Attendance Marking**: Rule enforcement with duplicate prevention per session (`AI_FACE`).
- **Manual Teacher Override**: Manual attendance correction with audit logging (`MANUAL`).
- **Student Dashboard & Analytics**: Subject-wise percentage table, visual progress bars, and low-attendance warning (<75%).
- **CSV Export**: One-click export of Firestore attendance records.
- **Dual-Mode Data Architecture**: Connects seamlessly to real Firebase Firestore or runs with local persistent storage for instant offline development.

---

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Recharts, React-Webcam, Firebase Web SDK
- **Backend**: Python 3.14, FastAPI, Uvicorn, Pydantic, Firebase Admin SDK
- **AI / Computer Vision**: OpenCV, NumPy, MediaPipe, SciPy, Scikit-learn

---

## Getting Started

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```
The FastAPI backend server will start at `http://localhost:8000`.
Health Check: `http://localhost:8000/health`

### 2. Frontend Setup
```bash
cd frontend
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
```
The React frontend dashboard will open at `http://localhost:3000`.

---

## Quick Demo Credentials

For quick role testing, click the quick demo buttons on the login page:
- **Admin**: `admin@college.edu`
- **Teacher**: `teacher@college.edu`
- **Student**: `student@college.edu`
- Password: `password123`

---

## Documentation Links

- [System Architecture](file:///C:/Users/Admin/.gemini/antigravity/scratch/attendance-system/docs/architecture.md)
- [Firebase Setup](file:///C:/Users/Admin/.gemini/antigravity/scratch/attendance-system/docs/firebase-setup.md)
- [AI Face Pipeline & Anti-Spoofing](file:///C:/Users/Admin/.gemini/antigravity/scratch/attendance-system/docs/ai-pipeline.md)
- [Testing & Verification](file:///C:/Users/Admin/.gemini/antigravity/scratch/attendance-system/docs/testing.md)
- [Deployment Guide](file:///C:/Users/Admin/.gemini/antigravity/scratch/attendance-system/docs/deployment.md)
