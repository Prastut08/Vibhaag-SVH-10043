import { Router, Response } from "express";
import { adminApp, adminDb } from "../lib/firebase-admin";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

/**
 * GET /firebase/health
 * Minimal test route to verify Firebase Admin initialization and Firestore reachability.
 */
router.get("/health", async (_req, res: Response) => {
  try {
    const initialized = Boolean(adminApp);
    const appName = adminApp.name;

    // Check Firestore connection status
    let firestoreStatus = "unknown";
    try {
      // List root collections (or read metadata) to verify reachability
      await adminDb.listCollections();
      firestoreStatus = "connected";
    } catch (fsErr: unknown) {
      firestoreStatus = fsErr instanceof Error ? fsErr.message : "connection_failed";
    }

    res.json({
      status: "ok",
      firebaseAdmin: {
        initialized,
        appName,
        projectId: adminApp.options.projectId || "not_configured",
      },
      firestore: {
        status: firestoreStatus,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({
      status: "error",
      message: err instanceof Error ? err.message : "Firebase initialization error",
    });
  }
});

/**
 * GET /firebase/verify-token
 * Test route to verify Firebase ID token verification middleware.
 */
router.get("/verify-token", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: "success",
    message: "Firebase token verified successfully",
    user: req.user,
  });
});

export default router;
