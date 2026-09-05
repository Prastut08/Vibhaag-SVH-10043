import { Request, Response, Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { adminDb } from "../lib/firebase-admin";

const router = Router();

const createSchema = z.object({
  sessionId: z.string().min(1),
  date: z.string().min(8),
  reason: z.string().min(6),
});

const updateSchema = z.object({
  status: z.enum(["approved", "denied"]),
});

router.get("/", requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await adminDb.collection("leave-requests").get();
    return res.json(snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() })));
  } catch {
    return res.json([]);
  }
});

router.post("/", requireAuth, requireRole(["student"]), async (req: AuthenticatedRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const docRef = adminDb.collection("leave-requests").doc();
  const request = {
    _id: docRef.id,
    id: docRef.id,
    studentId: req.user?.uid,
    sessionId: parsed.data.sessionId,
    date: parsed.data.date,
    reason: parsed.data.reason,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await docRef.set(request);
  return res.status(201).json(request);
});

router.patch("/:id", requireAuth, requireRole(["admin", "teacher", "faculty", "staff"]), async (req: AuthenticatedRequest, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const docRef = adminDb.collection("leave-requests").doc(req.params.id);
  await docRef.update({ status: parsed.data.status, reviewerId: req.user?.uid || null });
  return res.json({ id: req.params.id, status: parsed.data.status });
});

export default router;
