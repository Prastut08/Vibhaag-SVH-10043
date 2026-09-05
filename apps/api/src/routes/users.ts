import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { adminAuth, adminDb } from "../lib/firebase-admin";

const router = Router();

const userSchema = z.object({
  name: z.string().min(1),
  enrollmentNo: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "teacher", "student", "faculty", "staff"]),
  departmentId: z.string().optional(),
  batchId: z.string().optional(),
  password: z.string().optional(),
});

/**
 * Generate standard email from enrollment number: enrollmentno@gmail.com
 */
function getEmailForUser(enrollmentNo?: string, explicitEmail?: string): string {
  if (explicitEmail && explicitEmail.trim()) {
    return explicitEmail.trim().toLowerCase();
  }
  if (enrollmentNo && enrollmentNo.trim()) {
    const cleanNo = enrollmentNo.trim().toLowerCase();
    return cleanNo.endsWith("@gmail.com") ? cleanNo : `${cleanNo}@gmail.com`;
  }
  throw new Error("Either enrollment number or email must be provided");
}

/**
 * Get default initial password for role:
 * - teacher: teacher1234
 * - student: student123
 */
function getDefaultPassword(role: string, explicitPassword?: string): string {
  if (explicitPassword && explicitPassword.trim()) {
    return explicitPassword.trim();
  }
  if (role === "teacher" || role === "faculty") {
    return "teacher1234";
  }
  if (role === "student") {
    return "student123";
  }
  return "admin1234";
}

/**
 * GET /users
 * Only accessible by Admin.
 */
router.get("/", requireAuth, requireRole(["admin"]), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const listUsersResult = await adminAuth.listUsers(100);
    const users = listUsersResult.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      role: u.customClaims?.role || "student",
      disabled: u.disabled,
    }));
    return res.json(users);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch users";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /users
 * Admin provisioning endpoint to create student or teacher accounts.
 * Generates enrollmentno@gmail.com and sets initial default passwords.
 */
router.post("/", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.format() });
  }

  try {
    const role = parsed.data.role === "faculty" ? "teacher" : parsed.data.role;
    const email = getEmailForUser(parsed.data.enrollmentNo, parsed.data.email);
    const password = getDefaultPassword(role, parsed.data.password);

    // 1. Create user in Firebase Auth
    const firebaseUser = await adminAuth.createUser({
      email,
      password,
      displayName: parsed.data.name,
    });

    // 2. Set custom claim role (admin, teacher, student)
    await adminAuth.setCustomUserClaims(firebaseUser.uid, { role });

    // 3. Store user record in Firestore
    await adminDb.collection("users").doc(firebaseUser.uid).set({
      uid: firebaseUser.uid,
      name: parsed.data.name,
      email,
      role,
      enrollmentNo: parsed.data.enrollmentNo || null,
      departmentId: parsed.data.departmentId || null,
      batchId: parsed.data.batchId || null,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      uid: firebaseUser.uid,
      name: parsed.data.name,
      email,
      role,
      enrollmentNo: parsed.data.enrollmentNo || null,
      initialPassword: password,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create user";
    return res.status(400).json({ error: msg });
  }
});

export default router;
