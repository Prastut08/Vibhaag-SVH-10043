import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBaEZAaU-u2EWJ2kRlYyHTcEoQl1C_0EYM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "campus-management-25435.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "campus-management-25435",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "campus-management-25435.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "844788461550",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:844788461550:web:6ce09027f94176ff38e8ff",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JL3959NHVR",
};

import { getStorage } from "firebase/storage";

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
