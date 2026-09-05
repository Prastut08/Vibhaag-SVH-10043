import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth";
import { adminDb } from "../lib/firebase-admin";

const router = Router();

const announcementSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(3),
  audience: z.enum(["all", "department", "batch"]),
  audienceRef: z.string().optional(),
});

router.get("/", requireAuth, async (_req, res) => {
  try {
    const snap = await adminDb.collection("announcements").orderBy("createdAt", "desc").get();
    const announcements = snap.docs.map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() }));
    return res.json(announcements);
  } catch {
    return res.json([]);
  }
});

router.post("/", requireAuth, requireRole(["admin", "teacher", "faculty", "staff"]), async (req, res) => {
  const parsed = announcementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  if (parsed.data.audience !== "all" && !parsed.data.audienceRef) {
    return res.status(400).json({ error: "Audience reference required" });
  }

  try {
    const docRef = adminDb.collection("announcements").doc();
    const announcement = {
      _id: docRef.id,
      id: docRef.id,
      ...parsed.data,
      audienceRef: parsed.data.audience === "all" ? null : parsed.data.audienceRef,
      authorId: req.user?.uid || null,
      createdAt: new Date().toISOString(),
    };
    await docRef.set(announcement);
    return res.status(201).json(announcement);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create announcement";
    return res.status(500).json({ error: msg });
  }
});

/**
 * @openapi
 * /announcements:
 *   get:
 *     summary: List announcements
 *     tags:
 *       - Announcements
 *     responses:
 *       200:
 *         description: Announcements list
 */
export default router;
