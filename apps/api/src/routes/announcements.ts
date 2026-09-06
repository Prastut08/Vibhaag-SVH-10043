import { Router } from "express";
import { z } from "zod";
import { adminDb } from "../lib/firebase-admin";

const router = Router();

const announcementSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(3),
  audience: z.enum(["all", "department", "batch"]).default("all"),
  audienceRef: z.string().optional(),
  authorName: z.string().optional(),
  authorRole: z.string().optional(),
});

// GET /announcements - List all announcements from Firestore
router.get("/", async (_req, res) => {
  try {
    const snap = await adminDb.collection("announcements").orderBy("createdAt", "desc").get();
    const announcements = snap.docs.map((doc) => {
      const data = doc.data();
      return { _id: doc.id, id: doc.id, ...data };
    });
    return res.json(announcements);
  } catch (err: unknown) {
    console.warn("Express API fetch announcements notice:", err);
    return res.json([]);
  }
});

// POST /announcements - Create a new announcement in Firestore
router.post("/", async (req, res) => {
  const parsed = announcementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid announcement payload", details: parsed.error.format() });
  }

  try {
    const docRef = adminDb.collection("announcements").doc();
    const docData = {
      _id: docRef.id,
      id: docRef.id,
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience || "all",
      audienceRef: parsed.data.audienceRef || "",
      authorName: parsed.data.authorName || "Faculty Member",
      authorRole: parsed.data.authorRole || "faculty",
      createdAt: new Date().toISOString(),
    };

    await docRef.set(docData);
    console.log(`[Firebase Admin] Created announcement ${docRef.id} in Firestore`);
    return res.status(201).json(docData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create announcement in Firestore";
    console.error("Firestore creation error in API:", err);
    return res.status(500).json({ error: msg });
  }
});

// DELETE /announcements/:id - Remove announcement document from Firestore
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing document ID" });

  try {
    await adminDb.collection("announcements").doc(id).delete();
    return res.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete announcement";
    return res.status(500).json({ error: msg });
  }
});

export default router;
