import { Request, Response, NextFunction } from "express";
import { adminAuth, adminDb } from "../lib/firebase-admin";
import type { CampusHubRole, FirebaseUserPayload } from "@vibhaag/shared";

declare global {
  namespace Express {
    interface Request {
      user?: FirebaseUserPayload;
    }
  }
}

export type AuthenticatedRequest = Request;

/**
 * Authentication Middleware: Verifies Firebase ID Token in Authorization header.
 * Header format: Authorization: Bearer <Firebase ID Token>
 */


export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "Unauthorized: Missing Authorization header" });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Unauthorized: Malformed Authorization header. Expected 'Bearer <token>'" });
    return;
  }

  const idToken = parts[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const role = (decodedToken.role as CampusHubRole) || undefined;

    // Check account status in Firestore users collection
    let status = "active";
    try {
      const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
      if (userDoc.exists) {
        status = userDoc.data()?.status || "active";
      }
    } catch {
      // Fallback
    }

    if (status === "inactive") {
      res.status(403).json({ error: "Forbidden: Account has been deactivated by Campus Admin" });
      return;
    }

    req.user = {
      id: decodedToken.uid,
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      role,
      status,
    };

    next();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Invalid token";
    
    if (errorMessage.includes("expired")) {
      res.status(401).json({ error: "Unauthorized: Firebase ID token has expired" });
      return;
    }

    res.status(401).json({ error: `Unauthorized: Invalid Firebase ID token (${errorMessage})` });
    return;
  }
}

// Export alias for backward compatibility with existing route imports
export const requireAuth = authenticateToken;

/**
 * Role Authorization Middleware: Enforces Custom Claims roles (admin, teacher, student).
 */
export function requireRole(allowedRoles: (CampusHubRole | string)[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: User is not authenticated" });
      return;
    }

    if (req.user.status === "inactive") {
      res.status(403).json({ error: "Forbidden: Account has been deactivated by Campus Admin" });
      return;
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Required role matching [${allowedRoles.join(", ")}], got '${req.user.role || "none"}'`,
      });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole(["admin"]);
export const requireTeacher = requireRole(["teacher"]);
export const requireStudent = requireRole(["student"]);
