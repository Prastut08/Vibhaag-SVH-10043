import type { User as FirebaseUser, UserCredential } from "firebase/auth";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase";
import type { CampusHubRole } from "@vibhaag/shared";

export interface AuthUser {
  uid: string;
  email: string | null;
  role?: CampusHubRole;
  rawUser: FirebaseUser;
}

/**
 * Generate standard gmail from Enrollment Number (e.g. 2024001 -> 2024001@gmail.com)
 */
export function generateEmailFromEnrollment(enrollmentNo: string): string {
  const sanitized = enrollmentNo.trim().toLowerCase();
  return sanitized.endsWith("@gmail.com") ? sanitized : `${sanitized}@gmail.com`;
}

/**
 * Get default initial password for Campus Hub users based on role until changed.
 * - Teacher: teacher1234
 * - Student: student123
 */
export function getDefaultPasswordForRole(role: CampusHubRole): string {
  if (role === "teacher") {
    return "teacher1234";
  }
  if (role === "student") {
    return "student123";
  }
  return "admin1234";
}

/**
 * Sign in existing user with Email and Password.
 * Note: Self-signup for students and teachers is strictly disabled;
 * accounts are generated and provisioned by an administrator.
 */
export async function signIn(email: string, pass: string): Promise<UserCredential> {
  return await signInWithEmailAndPassword(auth, email, pass);
}

/**
 * Sign out current authenticated user.
 */
export async function signOutUser(): Promise<void> {
  return await firebaseSignOut(auth);
}

/**
 * Get current authenticated user or null if unauthenticated.
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Listen for authentication state changes and extract Custom Claims role.
 */
export function onAuthChange(
  callback: (user: AuthUser | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const tokenResult = await firebaseUser.getIdTokenResult();
      const role = tokenResult.claims.role as CampusHubRole | undefined;

      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role,
        rawUser: firebaseUser,
      });
    } catch {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        rawUser: firebaseUser,
      });
    }
  });
}
