import { Request, Response, Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { adminDb } from "../lib/firebase-admin";

const router = Router();

const sessionSchema = z.object({
  title: z.string().min(1),
  courseId: z.string().min(1),
  batchId: z.string().min(1),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  room: z.string().optional(),
});

router.get("/", requireAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await adminDb.collection("sessions").get();
    return res.json(snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() })));
  } catch {
    return res.json([]);
  }
});

router.post("/", requireAuth, requireRole(["admin"]), async (req: AuthenticatedRequest, res: Response) => {
  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const docRef = adminDb.collection("sessions").doc();
  const session = { _id: docRef.id, id: docRef.id, ...parsed.data, createdAt: new Date().toISOString() };
  await docRef.set(session);
  return res.status(201).json(session);
});

export default router;
