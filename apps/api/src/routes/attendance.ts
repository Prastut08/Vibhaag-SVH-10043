import { Router } from "express";
import dayjs from "dayjs";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth";
import { adminDb } from "../lib/firebase-admin";

const router = Router();

const checkInSchema = z.object({
  sessionId: z.string().min(1),
});

const checkOutSchema = z.object({
  attendanceId: z.string().min(1),
});

router.get("/me", requireAuth, async (_req, res) => {
  return res.json([]);
});

router.post("/check-in", requireAuth, requireRole(["teacher", "faculty", "admin", "staff"]), async (req, res) => {
  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const date = dayjs().format("YYYY-MM-DD");
  const now = dayjs().toISOString();
  const attendance = {
    sessionId: parsed.data.sessionId,
    facultyId: req.user?.uid,
    date,
    status: "checked-in",
    checkInAt: now,
  };
  return res.status(201).json(attendance);
});

router.post("/check-out", requireAuth, requireRole(["teacher", "faculty", "admin", "staff"]), async (req, res) => {
  const parsed = checkOutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  return res.json({ id: parsed.data.attendanceId, status: "checked-out" });
});

export default router;
