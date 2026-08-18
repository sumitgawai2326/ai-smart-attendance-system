# System Architecture Documentation

## Overview
The AI-Based Smart Attendance Monitoring System is built using a modern decoupled architecture:
- **Frontend**: React + Vite + Tailwind CSS + Lucide Icons + Recharts
- **Backend**: FastAPI + Uvicorn + Pydantic
- **AI Computer Vision Layer**: OpenCV + Face Detection + Eye Aspect Ratio (EAR) Liveness Anti-Spoofing + 128-d Vector Embeddings + Cosine Distance Matcher
- **Database Layer**: Firebase Authentication & Firestore (with automatic dual-mode local fallback)

## System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  React Frontend                                   |
|   [ Login ]   [ Admin Dashboard ]   [ Teacher Dashboard ]   [ Student Dashboard ] |
+-----------------------------------------+-----------------------------------------+
                                          |
                        REST APIs / JSON / WebCam Base64 Streams
                                          v
+-----------------------------------------------------------------------------------+
|                                FastAPI Backend                                    |
|   /auth       /students      /teachers       /classes       /attendance   /reports|
+------------------------------------+----------------------------------------------+
                                     |
           +-------------------------+-------------------------+
           |                                                   |
           v                                                   v
+------------------------------------+               +------------------------------+
|       AI Face Pipeline             |               |      Firestore Database      |
|  1. OpenCV Face Bounding Box       |               |  - users                     |
|  2. EAR Liveness Anti-Spoofing     |               |  - students                  |
|  3. 128-d Embedding Extraction     |               |  - attendance_sessions       |
|  4. Vector Cosine Similarity Match |               |  - attendance_records        |
+------------------------------------+               +------------------------------+
```
