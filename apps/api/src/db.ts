import { adminDb, isFirebaseAdminConfigured } from "./lib/firebase-admin";

export async function connectDb(): Promise<void> {
  if (!isFirebaseAdminConfigured()) {
    console.warn("[Firebase Admin] Service account credentials or emulator host not configured. Skipping database connection check.");
    return;
  }
  await adminDb.listCollections();
}


