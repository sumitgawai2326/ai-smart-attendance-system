# Production Deployment Guide

## 1. Frontend Deployment (Vercel / Firebase Hosting)
1. Build static production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy `dist/` directory to Vercel or Firebase Hosting.

## 2. Backend Deployment (Render / Railway / Cloud Run)
1. Environment variables: Set `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_PATH`, `FACE_MATCH_THRESHOLD`.
2. Start command:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
