import { adminDb } from "./lib/firebase-admin";

/**
 * Ensures Firebase Admin and Firestore connection is established.
 */
export async function connectDb(): Promise<void> {
  // Simple check to verify Firestore is reachable on startup
  await adminDb.listCollections();
}

