import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth";
import { adminDb } from "../lib/firebase-admin";

const router = Router();

const batchSchema = z.object({
  name: z.string().min(1),
  year: z.number().int(),
  departmentId: z.string().min(1),
});

router.get("/", requireAuth, async (_req, res) => {
  try {
    const snap = await adminDb.collection("batches").get();
    return res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch {
    return res.json([]);
  }
});

router.post("/", requireAuth, requireRole(["admin"]), async (req, res) => {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const docRef = adminDb.collection("batches").doc();
  const batch = { id: docRef.id, ...parsed.data, createdAt: new Date().toISOString() };
  await docRef.set(batch);
  return res.status(201).json(batch);
});

export default router;
