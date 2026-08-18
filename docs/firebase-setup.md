# Firebase Setup Guide

## 1. Firebase Project Creation
1. Go to [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Name your project `smart-attendance-ai`.

## 2. Enable Authentication & Firestore
1. Under **Build**, select **Authentication** and enable **Email/Password** provider.
2. Select **Firestore Database** and create a database in **Production mode**.

## 3. Configure Credentials in `.env`
Add your service account path in `backend/.env`:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json
FIREBASE_PROJECT_ID=smart-attendance-ai
```

Add your Web App API keys in `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=smart-attendance-ai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smart-attendance-ai
```
