import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// Find actual .env file
const candidatePaths = [
  process.env.DOTENV_FILE,
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(__dirname, "../../../.env"),
].filter((p): p is string => typeof p === "string" && p.length > 0 && fs.existsSync(p));

if (candidatePaths.length > 0) {
  dotenv.config({ path: candidatePaths[0] });
}

function sanitizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  let cleaned = key.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, "\n");
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID ?? "vibhaag-f4096",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: sanitizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  adminEmail: process.env.ADMIN_EMAIL ?? "ileshkumar975@gmail.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "123456789",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
