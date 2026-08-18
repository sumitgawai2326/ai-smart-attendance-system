import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const REQUIRED_ENV_VARS = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(REQUIRED_ENV_VARS)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`);

if (missing.length > 0) {
  throw new Error(
    `[Firebase] Missing required environment variable(s): ${missing.join(", ")}. ` +
    "Ensure these are defined in your .env file before running the app."
  );
}

const firebaseConfig = {
  ...REQUIRED_ENV_VARS,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // optional
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
