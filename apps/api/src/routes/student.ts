import { Request, Response, Router } from "express";
import dayjs from "dayjs";
import { z } from "zod";

import { requireAuth, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { adminDb } from "../lib/firebase-admin";

const router = Router();

const checkInSchema = z.object({
  sessionId: z.string().min(1),
});

router.get("/schedule", requireAuth, requireRole(["student"]), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await adminDb.collection("sessions").get();
    return res.json(snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() })));
  } catch {
    return res.json([]);
  }
});

router.get("/attendance", requireAuth, requireRole(["student"]), async (_req: AuthenticatedRequest, res: Response) => {
  return res.json([]);
});

router.post("/attendance/check-in", requireAuth, requireRole(["student"]), async (req: AuthenticatedRequest, res: Response) => {
  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const date = dayjs().format("YYYY-MM-DD");
  const now = dayjs().toISOString();
  const attendance = {
    sessionId: parsed.data.sessionId,
    studentId: req.user?.uid,
    date,
    status: "present",
    checkInAt: now,
  };
  return res.status(201).json(attendance);
});

export default router;
