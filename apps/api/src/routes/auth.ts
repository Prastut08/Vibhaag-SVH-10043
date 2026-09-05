import { Router, Response } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { adminAuth, adminDb } from "../lib/firebase-admin";

const router = Router();

/**
 * GET /auth/me
 * Returns current authenticated user profile verified via Firebase ID Token & Firestore profile.
 */
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: "Campus Hub profile does not exist for this account." });
    }

    const data = userDoc.data();
    if (data?.status === "inactive") {
      return res.status(403).json({ error: "Account has been deactivated by Campus Admin." });
    }

    const trustedRole = req.user.role || data?.role;
    if (!trustedRole || !["admin", "teacher", "student"].includes(trustedRole)) {
      return res.status(403).json({ error: "Invalid or unassigned user role." });
    }

    return res.json({
      id: req.user.uid,
      uid: req.user.uid,
      email: data?.email || req.user.email,
      name: data?.name || req.user.email?.split("@")[0] || "User",
      role: trustedRole,
      status: data?.status || "active",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch user profile";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /auth/verify
 * Validates login for specific portal role (admin | student | teacher).
 * Verifies custom claims role matching, profile existence, and active account status.
 */
router.post("/verify", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const { expectedRole, identifier } = req.body || {};
  if (!expectedRole || !["admin", "student", "teacher"].includes(expectedRole)) {
    return res.status(400).json({ error: "Invalid or missing expectedRole parameter." });
  }

  const roleLabel = expectedRole === "admin" ? "Admin" : expectedRole === "student" ? "Student" : "Teacher";

  try {
    // 1. Fetch Campus Hub user profile from Firestore
    const userDoc = await adminDb.collection("users").doc(req.user.uid).get();
    let userData = userDoc.exists ? userDoc.data() : null;

    // Check specific role collections if users/{uid} is missing
    if (!userData) {
      if (expectedRole === "student") {
        const sDoc = await adminDb.collection("students").doc(req.user.uid).get();
        if (sDoc.exists) userData = sDoc.data();
      } else if (expectedRole === "teacher") {
        const tDoc = await adminDb.collection("teachers").doc(req.user.uid).get();
        if (tDoc.exists) userData = tDoc.data();
      } else if (expectedRole === "admin") {
        const aDoc = await adminDb.collection("admins").doc(req.user.uid).get();
        if (aDoc.exists) userData = aDoc.data();
      }
    }

    if (!userData) {
      return res.status(403).json({ error: "This account is not configured for Campus Hub." });
    }

    if (userData.status === "inactive") {
      return res.status(403).json({ error: "This account is inactive. Contact your administrator." });
    }

    // Determine trusted role from Custom Claim or Firestore document
    const userRole = req.user.role || userData.role;
    if (!userRole || userRole !== expectedRole) {
      return res.status(403).json({ error: `This account is not authorized for ${roleLabel} login.` });
    }

    // Ensure Custom Claim is set on Firebase Auth user if missing
    if (!req.user.role && userRole) {
      await adminAuth.setCustomUserClaims(req.user.uid, { role: userRole }).catch(() => {});
    }

    // 3. Role-specific profile validation
    if (expectedRole === "admin") {
      const adminDoc = await adminDb.collection("admins").doc(req.user.uid).get();
      if (!adminDoc.exists && userData?.role !== "admin") {
        return res.status(403).json({ error: "This account is not configured for Campus Hub." });
      }
    } else if (expectedRole === "student") {
      const studentDoc = await adminDb.collection("students").doc(req.user.uid).get();
      if (!studentDoc.exists) {
        return res.status(403).json({ error: "This account is not configured for Campus Hub." });
      }

      const studentData = studentDoc.data();
      if (studentData?.status === "inactive") {
        return res.status(403).json({ error: "This account is inactive. Contact your administrator." });
      }

      if (identifier) {
        const cleanIdent = String(identifier).trim().toUpperCase();
        const docEnroll = (studentData?.enrollmentNumber || studentData?.enrollmentNo || "").trim().toUpperCase();
        if (docEnroll && docEnroll !== cleanIdent) {
          return res.status(403).json({ error: "Invalid credentials." });
        }
      }
    } else if (expectedRole === "teacher") {
      const teacherDoc = await adminDb.collection("teachers").doc(req.user.uid).get();
      if (!teacherDoc.exists) {
        return res.status(403).json({ error: "This account is not configured for Campus Hub." });
      }

      const teacherData = teacherDoc.data();
      if (teacherData?.status === "inactive") {
        return res.status(403).json({ error: "This account is inactive. Contact your administrator." });
      }

      if (identifier) {
        const cleanIdent = String(identifier).trim().toUpperCase();
        const docId = (teacherData?.teacherIdentifier || teacherData?.teacherId || "").trim().toUpperCase();
        if (docId && docId !== cleanIdent) {
          return res.status(403).json({ error: "Invalid credentials." });
        }
      }
    }

    return res.json({
      success: true,
      uid: req.user.uid,
      name: userData?.name || req.user.email?.split("@")[0] || "User",
      email: userData?.email || req.user.email,
      role: expectedRole,
      status: userData?.status || "active",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Authentication verification failed";
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /auth/status
 * Returns system bootstrapping status.
 */
router.get("/status", async (_req, res: Response) => {
  return res.json({ hasUsers: true });
});

export default router;

