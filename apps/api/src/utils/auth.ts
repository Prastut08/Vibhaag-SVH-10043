import bcrypt from "bcryptjs";
import { adminAuth } from "../lib/firebase-admin";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createCustomToken(uid: string, claims?: Record<string, unknown>) {
  return adminAuth.createCustomToken(uid, claims);
}
