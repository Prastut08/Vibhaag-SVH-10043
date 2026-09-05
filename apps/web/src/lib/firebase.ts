import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyBvpvwCuCiGR7kaqUVuJi-Kcs0NEivB9Jc",

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "vibhaag-f4096.firebaseapp.com",

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    "vibhaag-f4096",

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "vibhaag-f4096.firebasestorage.app",

  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "545444424914",

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:545444424914:web:66e1d76a3244af30aad10b",

  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    "G-444CF6TG5W",
};

// Initialize Firebase only once
export const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;