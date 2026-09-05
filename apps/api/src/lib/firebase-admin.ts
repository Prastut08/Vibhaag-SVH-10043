import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth, UserRecord } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";
import { config } from "../config";

export function isFirebaseAdminConfigured(): boolean {
  const { firebaseClientEmail, firebasePrivateKey } = config;
  const hasCert = Boolean(
    firebaseClientEmail &&
      firebasePrivateKey &&
      firebasePrivateKey.includes("BEGIN PRIVATE KEY")
  );
  const hasCustomEmulator = Boolean(
    (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8080") ||
      (process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099")
  );
  return hasCert || hasCustomEmulator;
}


function initFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const { firebaseProjectId, firebaseClientEmail, firebasePrivateKey } = config;

  if (
    firebaseClientEmail &&
    firebasePrivateKey &&
    firebasePrivateKey.includes("BEGIN PRIVATE KEY")
  ) {
    try {
      return initializeApp({
        credential: cert({
          projectId: firebaseProjectId,
          clientEmail: firebaseClientEmail,
          privateKey: firebasePrivateKey,
        }),
        storageBucket: `${firebaseProjectId}.firebasestorage.app`,
      });
    } catch (err: unknown) {
      console.warn(
        "[Firebase Admin] Service account cert initialization notice:",
        err instanceof Error ? err.message : err
      );
    }
  }

  if (!process.env.FIRESTORE_EMULATOR_HOST && !config.firebaseClientEmail && !config.firebasePrivateKey) {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  }

  return initializeApp({
    projectId: firebaseProjectId,
    storageBucket: `${firebaseProjectId}.firebasestorage.app`,
  });
}



export const adminApp: App = initFirebaseAdmin();
export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
export const adminStorage: Storage = getStorage(adminApp);

export async function bootstrapAdminAccount(): Promise<UserRecord | null> {
  if (!isFirebaseAdminConfigured()) {
    console.warn("[Firebase Admin] Skipping admin bootstrap: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY not set in .env");
    return null;
  }

  const email = config.adminEmail;
  const password = config.adminPassword;

  if (!email || !password) {
    console.warn("Skipping admin bootstrap: ADMIN_EMAIL or ADMIN_PASSWORD not configured.");
    return null;
  }

  try {
    let adminUser: UserRecord;

    try {
      adminUser = await adminAuth.getUserByEmail(email);
      await adminAuth.updateUser(adminUser.uid, { password });
    } catch {
      adminUser = await adminAuth.createUser({
        email,
        password,
        displayName: "Campus Admin",
        emailVerified: true,
      });
      console.log(`[Firebase Admin] Created initial admin user: ${email} (${adminUser.uid})`);
    }

    await adminAuth.setCustomUserClaims(adminUser.uid, { role: "admin" });

    const profile = {
      uid: adminUser.uid,
      email,
      name: adminUser.displayName || "Campus Admin",
      role: "admin",
      status: "active",
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection("admins").doc(adminUser.uid).set(profile, { merge: true });
    await adminDb.collection("users").doc(adminUser.uid).set(profile, { merge: true });

    return adminUser;
  } catch (err: unknown) {
    console.warn("[Firebase Admin] Admin bootstrap notice:", err instanceof Error ? err.message : err);
    return null;
  }
}

