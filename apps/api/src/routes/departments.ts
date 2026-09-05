import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth";
import { adminDb } from "../lib/firebase-admin";

const router = Router();

const departmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2),
});

router.get("/", requireAuth, async (_req, res) => {
  try {
    const snap = await adminDb.collection("departments").get();
    return res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch {
    return res.json([]);
  }
});

router.post("/", requireAuth, requireRole(["admin"]), async (req, res) => {
  const parsed = departmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const docRef = adminDb.collection("departments").doc();
  const department = { id: docRef.id, ...parsed.data, createdAt: new Date().toISOString() };
  await docRef.set(department);
  return res.status(201).json(department);
});

export default router;
