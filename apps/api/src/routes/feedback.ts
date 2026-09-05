import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth";
import { adminDb } from "../lib/firebase-admin";

const router = Router();

const createSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

router.get("/", requireAuth, async (_req, res) => {
  try {
    const snap = await adminDb.collection("feedback").get();
    return res.json(snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() })));
  } catch {
    return res.json([]);
  }
});

router.post("/", requireAuth, requireRole(["student"]), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const docRef = adminDb.collection("feedback").doc();
  const feedback = {
    _id: docRef.id,
    id: docRef.id,
    sessionId: parsed.data.sessionId,
    studentId: req.user?.uid,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
    createdAt: new Date().toISOString(),
  };
  await docRef.set(feedback);
  return res.status(201).json(feedback);
});

export default router;
