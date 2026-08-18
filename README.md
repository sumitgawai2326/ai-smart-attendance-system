# AI-Based Smart Attendance Monitoring System

[![Live Demo](https://img.shields.io/badge/Live_Demo-Firebase_Hosting-0284c7?style=for-the-badge&logo=firebase)](https://ai--based-smart-attendance.web.app)
[![API Status](https://img.shields.io/badge/API_Status-Render_Cloud-10b981?style=for-the-badge&logo=render)](https://ai-attendance-backend-3v8s.onrender.com/health)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/sumitgawai2326/ai-smart-attendance-system)

An enterprise-grade, cloud-deployed **AI Smart Attendance System** engineered for college and corporate environments. Powered by **FastAPI, OpenCV, SFace Deep Learning, and React**, the platform features real-time multi-student face recognition, adaptive safety margins for zero false attendance, anti-spoofing liveness verification, and session-scoped duplicate protection.

---

## 🌟 Live Production Links

* 🌐 **Live Web Application (PWA):** [https://ai--based-smart-attendance.web.app](https://ai--based-smart-attendance.web.app)
* ⚙️ **Production FastAPI Backend:** [https://ai-attendance-backend-3v8s.onrender.com](https://ai-attendance-backend-3v8s.onrender.com)
* 🩺 **Backend Health Probe:** [https://ai-attendance-backend-3v8s.onrender.com/health](https://ai-attendance-backend-3v8s.onrender.com/health)
* 📱 **PWA Standalone App:** Open the live link on Android/iOS and select **"Add to Home Screen"**

---

## 🏛️ System Architecture

```text
                             INTERNET (HTTPS)
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
   ┌───────────────────────┐                 ┌───────────────────────┐
   │  Frontend (PWA)       │  REST API / JSON│  FastAPI Backend      │
   │  React + Vite SPA     ├────────────────►│  Docker Container     │
   │  Firebase Global CDN  │                 │  Render Cloud 24/7    │
   └───────────────────────┘                 └───────────┬───────────┘
                                                         │
                                             ┌───────────┴───────────┐
                                             ▼                       ▼
                                      Cloud Firestore         AI Biometrics Engine
                                      (Database)              (SFace + Spatial LBP)
```

---

## 🚀 Key Engineering Features

1. **Multi-Student Simultaneous Recognition**: Detects and tracks multiple faces in the camera frame independently using IoU and Centroid association.
2. **False-Positive Prevention Architecture**:
   * Strict minimum threshold ($S_1 \ge 0.65$).
   * Adaptive second-best safety margin ($S_1 - S_2 \ge 0.08$) to safely reject ambiguous/lookalike faces.
   * Temporal buffer confirmation ($\ge 2$ consecutive frames on same track ID).
3. **Session-Scoped Idempotency & Duplicate Protection**: Uses deterministic composite document keys (`ATT_{sessionId}_{studentId}`) and backend synchronization locks to guarantee exactly 1 record per student per session under all concurrency conditions.
4. **Anti-Spoofing Liveness Gate**: Eye Aspect Ratio (EAR) blink estimation + texture variance analysis to prevent photo/screen spoofing.
5. **Multi-Role Dashboards**: Role-based access for Faculty Teachers, Students, and Administrators with attendance analytics and low-attendance warnings (<75%).
6. **Progressive Web App (PWA)**: Full mobile-responsive UI with standalone app manifest, offline capability, and camera integration.
7. **24/7 Cloud Architecture**: Independent cloud container deployment on Render Docker + Google Firebase CDN that operates without requiring a local machine to be powered on.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, React-Webcam, Axios |
| **Backend API** | Python 3.11, FastAPI, Uvicorn (ASGI), Pydantic Settings |
| **AI / Computer Vision** | OpenCV (Headless), SFace Deep Learning FaceRecognizer (ONNX), Spatial LBP + Directional HOG |
| **Database & Cloud** | Firebase Firestore, Firebase Hosting, Render Cloud, Docker |

---

## 💻 Local Development Setup

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*API Server starts at `http://localhost:8000` (Health Check: `http://localhost:8000/health`)*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend interface starts at `http://localhost:3000`*

### 3. Automated Test Suite
```bash
python -m pytest backend/tests/ -s
```
*Executes all 12 unit, integration, idempotency, and biometric matrix tests.*

---

## 🔑 Quick Demo Credentials

* **Teacher Profile**: `teacher@college.edu` | `password123`
* **Admin Profile**: `admin@college.edu` | `password123`
* **Student Profile**: `student@college.edu` | `password123`

---

## 📄 Documentation

* [System Architecture](docs/architecture.md)
* [AI Face Pipeline & Biometric Calibration](docs/ai-pipeline.md)
* [Testing & Validation Suites](docs/testing.md)
* [Production Cloud Deployment](docs/deployment.md)
* [Firebase Configuration](docs/firebase-setup.md)
