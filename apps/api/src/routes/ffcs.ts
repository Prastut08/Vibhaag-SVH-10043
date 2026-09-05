import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin, requireStudent, requireTeacher, AuthenticatedRequest } from "../middleware/auth";
import { adminDb, syncFFCSOfferingLiveState, rebuildFFCSLiveState } from "../lib/firebase-admin";
import { TIMETABLE_SLOTS } from "@vibhaag/shared";

const router = Router();

const windowSchema = z.object({
  semester: z.union([z.number(), z.string()]),
  academicYear: z.string().min(1, "Academic year is required"),
  startDateTime: z.string().min(1, "Start date time is required"),
  endDateTime: z.string().min(1, "End date time is required"),
  status: z.enum(["scheduled", "open", "closed"]).default("scheduled"),
});

const offeringSchema = z.object({
  windowId: z.string().min(1, "Window ID is required"),
  semester: z.union([z.number(), z.string()]),
  subjectId: z.string().min(1, "Subject ID is required"),
  subjectName: z.string().min(1, "Subject name is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  teacherName: z.string().min(1, "Teacher name is required"),
  day: z.string().min(1, "Day is required"),
  slotId: z.string().min(1, "Slot ID is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be at least 1"),
});

const applicationSubmitSchema = z.object({
  windowId: z.string().min(1, "Window ID is required"),
  offeringId: z.string().min(1, "Offering ID is required"),
});

router.post("/admin/ffcs/windows", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = windowSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid window payload", details: parsed.error.format() });
  }

  try {
    const docRef = adminDb.collection("ffcsWindows").doc();
    const windowData = {
      id: docRef.id,
      semester: String(parsed.data.semester),
      academicYear: parsed.data.academicYear,
      startDateTime: parsed.data.startDateTime,
      endDateTime: parsed.data.endDateTime,
      status: parsed.data.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(windowData);
    await rebuildFFCSLiveState(docRef.id);
    return res.status(201).json(windowData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create FFCS window";
    return res.status(500).json({ error: msg });
  }
});

router.get("/admin/ffcs/windows", requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await adminDb.collection("ffcsWindows").orderBy("createdAt", "desc").get();
    const windows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(windows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch FFCS windows";
    return res.status(500).json({ error: msg });
  }
});

router.patch("/admin/ffcs/windows/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, startDateTime, endDateTime, semester, academicYear } = req.body;

  try {
    const docRef = adminDb.collection("ffcsWindows").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "FFCS window not found" });
    }

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (status && ["scheduled", "open", "closed"].includes(status)) updates.status = status;
    if (startDateTime) updates.startDateTime = startDateTime;
    if (endDateTime) updates.endDateTime = endDateTime;
    if (semester !== undefined) updates.semester = String(semester);
    if (academicYear) updates.academicYear = academicYear;

    await docRef.update(updates);
    await rebuildFFCSLiveState(id);
    return res.json({ id, ...snap.data(), ...updates });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update FFCS window";
    return res.status(500).json({ error: msg });
  }
});

router.post("/admin/ffcs/windows/:id/sync-live", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    await rebuildFFCSLiveState(id);
    return res.json({ success: true, message: "RTDB live state synchronized successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to sync live state";
    return res.status(500).json({ error: msg });
  }
});

router.post("/admin/ffcs/offerings", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = offeringSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid offering payload", details: parsed.error.format() });
  }

  const { windowId, semester, subjectId, subjectName, teacherId, teacherName, day, slotId, capacity } = parsed.data;

  const slotInfo = TIMETABLE_SLOTS.find((s) => s.id === slotId);
  const startTime = parsed.data.startTime || slotInfo?.startTime || "08:30";
  const endTime = parsed.data.endTime || slotInfo?.endTime || "10:00";

  try {
    const docRef = adminDb.collection("ffcsOfferings").doc();
    const offeringData = {
      id: docRef.id,
      windowId,
      semester: String(semester),
      subjectId,
      subjectName,
      teacherId,
      teacherName,
      day,
      slotId,
      startTime,
      endTime,
      capacity: Number(capacity),
      seatsFilled: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(offeringData);
    await syncFFCSOfferingLiveState(windowId, docRef.id);
    return res.status(201).json(offeringData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create course offering";
    return res.status(500).json({ error: msg });
  }
});

router.get("/admin/ffcs/offerings", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { windowId, semester, subjectId, teacherId } = req.query;

  try {
    let queryRef: FirebaseFirestore.Query = adminDb.collection("ffcsOfferings");
    if (windowId) queryRef = queryRef.where("windowId", "==", String(windowId));
    if (semester) queryRef = queryRef.where("semester", "==", String(semester));
    if (subjectId) queryRef = queryRef.where("subjectId", "==", String(subjectId));
    if (teacherId) queryRef = queryRef.where("teacherId", "==", String(teacherId));

    const snap = await queryRef.get();
    const offerings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(offerings);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch course offerings";
    return res.status(500).json({ error: msg });
  }
});

router.patch("/admin/ffcs/offerings/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { capacity, status, day, slotId } = req.body;

  try {
    const docRef = adminDb.collection("ffcsOfferings").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Offering not found" });
    }

    const windowId = snap.data()?.windowId;
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (capacity !== undefined) updates.capacity = Number(capacity);
    if (status && ["active", "inactive"].includes(status)) updates.status = status;
    if (day) updates.day = day;
    if (slotId) {
      updates.slotId = slotId;
      const slotInfo = TIMETABLE_SLOTS.find((s) => s.id === slotId);
      if (slotInfo) {
        updates.startTime = slotInfo.startTime;
        updates.endTime = slotInfo.endTime;
      }
    }

    await docRef.update(updates);
    if (windowId) {
      await syncFFCSOfferingLiveState(windowId, id);
    }
    return res.json({ id, ...snap.data(), ...updates });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update offering";
    return res.status(500).json({ error: msg });
  }
});

router.get("/admin/ffcs/applications", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { windowId } = req.query;

  try {
    let queryRef: FirebaseFirestore.Query = adminDb.collection("ffcsApplications");
    if (windowId) queryRef = queryRef.where("windowId", "==", String(windowId));

    const snap = await queryRef.get();
    const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(apps);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch applications";
    return res.status(500).json({ error: msg });
  }
});

router.get("/admin/ffcs/allocations", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { windowId } = req.query;

  try {
    let queryRef: FirebaseFirestore.Query = adminDb.collection("ffcsAllocations");
    if (windowId) queryRef = queryRef.where("windowId", "==", String(windowId));

    const snap = await queryRef.get();
    const allocations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(allocations);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch allocations";
    return res.status(500).json({ error: msg });
  }
});

router.post("/admin/ffcs/windows/:id/allocate", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const windowRef = adminDb.collection("ffcsWindows").doc(id);
    const windowSnap = await windowRef.get();
    if (!windowSnap.exists) {
      return res.status(404).json({ error: "FFCS window not found" });
    }

    const windowData = windowSnap.data();
    const windowSem = Number(windowData?.semester ?? 1);

    const offeringsSnap = await adminDb.collection("ffcsOfferings").where("windowId", "==", id).get();
    const applicationsSnap = await adminDb.collection("ffcsApplications").where("windowId", "==", id).get();

    const offerings = offeringsSnap.docs.map((d) => ({ id: d.id, ref: d.ref, ...(d.data() as any) }));
    const applications = applicationsSnap.docs.map((d) => ({ id: d.id, ref: d.ref, ...(d.data() as any) }));

    let totalAllocated = 0;
    let totalRejected = 0;

    for (const offering of offerings) {
      const offeringApps = applications.filter((app) => app.offeringId === offering.id && app.status !== "cancelled");
      const capacity = Number(offering.capacity ?? 60);

      offeringApps.sort((a, b) => {
        if (windowSem === 1 || String(a.semester) === "1") {
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }

        const cgpaA = typeof a.cgpaSnapshot === "number" ? a.cgpaSnapshot : 0;
        const cgpaB = typeof b.cgpaSnapshot === "number" ? b.cgpaSnapshot : 0;

        if (cgpaB !== cgpaA) {
          return cgpaB - cgpaA;
        }
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      });

      const batch = adminDb.batch();
      let filledCount = 0;

      for (let i = 0; i < offeringApps.length; i++) {
        const app = offeringApps[i];
        if (i < capacity) {
          batch.update(app.ref, { status: "allocated", updatedAt: new Date().toISOString() });
          filledCount++;
          totalAllocated++;

          const allocRef = adminDb.collection("ffcsAllocations").doc();
          batch.set(allocRef, {
            id: allocRef.id,
            windowId: id,
            studentId: app.studentId,
            subjectId: app.subjectId,
            offeringId: offering.id,
            priorityType: (windowSem === 1 || String(app.semester) === "1") ? "sem1_fcfs" : "sem2_cgpa",
            cgpaSnapshot: app.cgpaSnapshot ?? null,
            allocatedAt: new Date().toISOString(),
          });
        } else {
          batch.update(app.ref, { status: "waitlisted", updatedAt: new Date().toISOString() });
          totalRejected++;
        }
      }

      batch.update(offering.ref, { seatsFilled: filledCount, updatedAt: new Date().toISOString() });
      await batch.commit();
    }

    await windowRef.update({ status: "closed", updatedAt: new Date().toISOString() });
    await rebuildFFCSLiveState(id);

    return res.json({
      success: true,
      message: "Allocation engine executed successfully",
      summary: {
        windowId: id,
        totalOfferings: offerings.length,
        totalApplications: applications.length,
        totalAllocated,
        totalWaitlisted: totalRejected,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to run allocation engine";
    return res.status(500).json({ error: msg });
  }
});

router.get("/student/ffcs/current", requireAuth, requireStudent, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const studentDoc = await adminDb.collection("students").doc(uid).get();
    const studentData = studentDoc.exists ? studentDoc.data() : null;
    const studentSem = studentData?.semester ? String(studentData.semester) : "1";

    const windowsSnap = await adminDb.collection("ffcsWindows").get();
    const nowIso = new Date().toISOString();

    const openWindowDoc = windowsSnap.docs.find((d) => {
      const data = d.data();
      return String(data.semester) === studentSem && data.status === "open";
    });

    const matchingWindowDoc = openWindowDoc || windowsSnap.docs.find((d) => {
      const data = d.data();
      return String(data.semester) === studentSem;
    });

    if (!matchingWindowDoc) {
      return res.json({
        active: false,
        reason: "No FFCS selection window configured for your semester.",
        student: { semester: studentSem, branch: studentData?.branch || null },
      });
    }

    const windowData = { id: matchingWindowDoc.id, ...matchingWindowDoc.data() as any };

    if (windowData.status === "open") {
      return res.json({
        active: true,
        window: windowData,
        student: { semester: studentSem, branch: studentData?.branch || null },
      });
    }

    if (windowData.status === "closed") {
      return res.json({
        active: false,
        reason: "FFCS selection is closed.",
        window: windowData,
        student: { semester: studentSem, branch: studentData?.branch || null },
      });
    }

    if (windowData.status === "scheduled" && nowIso < windowData.startDateTime) {
      return res.json({
        active: false,
        reason: "FFCS selection has not started yet.",
        window: windowData,
        student: { semester: studentSem, branch: studentData?.branch || null },
      });
    }

    return res.json({
      active: true,
      window: windowData,
      student: { semester: studentSem, branch: studentData?.branch || null },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch student FFCS status";
    return res.status(500).json({ error: msg });
  }
});

router.get("/student/ffcs/offerings", requireAuth, requireStudent, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const studentDoc = await adminDb.collection("students").doc(uid).get();
    const studentSem = studentDoc.exists ? String(studentDoc.data()?.semester || "1") : "1";

    const windowsSnap = await adminDb.collection("ffcsWindows").where("semester", "==", studentSem).get();
    if (windowsSnap.empty) {
      return res.json([]);
    }

    const activeWindow = windowsSnap.docs.map((d) => ({ id: d.id, ...d.data() as any })).find((w) => w.status === "open");

    if (!activeWindow) {
      return res.json([]);
    }

    const offeringsSnap = await adminDb.collection("ffcsOfferings").where("windowId", "==", activeWindow.id).where("status", "==", "active").get();
    const offerings = offeringsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return res.json(offerings);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch offerings";
    return res.status(500).json({ error: msg });
  }
});

router.get("/student/ffcs/applications", requireAuth, requireStudent, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const snap = await adminDb.collection("ffcsApplications").where("studentId", "==", uid).get();
    const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json(apps);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch student applications";
    return res.status(500).json({ error: msg });
  }
});

router.post("/student/ffcs/applications", requireAuth, requireStudent, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsed = applicationSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid application payload", details: parsed.error.format() });
  }

  const { windowId, offeringId } = parsed.data;

  try {
    const studentDoc = await adminDb.collection("students").doc(uid).get();
    if (!studentDoc.exists) {
      return res.status(403).json({ error: "Student profile not found in database." });
    }

    const studentData = studentDoc.data();
    const studentSem = Number(studentData?.semester ?? 1);
    const studentName = studentData?.name || req.user?.email || "Student";
    const trustedCgpa = typeof studentData?.cgpa === "number" ? studentData.cgpa : 8.0;

    const windowRef = adminDb.collection("ffcsWindows").doc(windowId);
    const windowSnap = await windowRef.get();
    if (!windowSnap.exists) {
      return res.status(404).json({ error: "FFCS window not found." });
    }

    const windowData = windowSnap.data();
    const nowIso = new Date().toISOString();

    if (windowData?.status !== "open") {
      return res.status(400).json({ error: "FFCS selection window is not currently open." });
    }

    const offeringRef = adminDb.collection("ffcsOfferings").doc(offeringId);

    const result = await adminDb.runTransaction(async (transaction) => {
      const offeringDoc = await transaction.get(offeringRef);
      if (!offeringDoc.exists) {
        throw new Error("No such slot available.");
      }

      const offeringData = offeringDoc.data();
      if (offeringData?.status !== "active" || offeringData?.windowId !== windowId) {
        throw new Error("Invalid course offering.");
      }

      const capacity = Number(offeringData.capacity ?? 60);
      const seatsFilled = Number(offeringData.seatsFilled ?? 0);

      if (seatsFilled >= capacity) {
        throw new Error("No such slot available. Capacity reached.");
      }

      const existingSubjectAppsSnap = await adminDb
        .collection("ffcsApplications")
        .where("studentId", "==", uid)
        .where("windowId", "==", windowId)
        .where("subjectId", "==", offeringData.subjectId)
        .get();

      const activeSubjectApp = existingSubjectAppsSnap.docs.find((d) => d.data().status !== "cancelled");
      if (activeSubjectApp) {
        throw new Error(`You have already selected an offering for ${offeringData.subjectName}.`);
      }

      const existingStudentAppsSnap = await adminDb
        .collection("ffcsApplications")
        .where("studentId", "==", uid)
        .where("windowId", "==", windowId)
        .get();

      const activeStudentApps = existingStudentAppsSnap.docs
        .map((d) => d.data())
        .filter((a) => a.status !== "cancelled");

      for (const app of activeStudentApps) {
        const otherOfferingDoc = await adminDb.collection("ffcsOfferings").doc(app.offeringId).get();
        if (otherOfferingDoc.exists) {
          const otherOffering = otherOfferingDoc.data();
          if (otherOffering?.day === offeringData.day && otherOffering?.slotId === offeringData.slotId) {
            throw new Error(`Timetable slot conflict: You already have a course selected on ${offeringData.day} at ${offeringData.startTime}–${offeringData.endTime}.`);
          }
        }
      }

      const cgpaSnapshot = studentSem === 1 ? null : trustedCgpa;
      const appRef = adminDb.collection("ffcsApplications").doc();

      const newApp = {
        id: appRef.id,
        windowId,
        studentId: uid,
        studentName,
        semester: String(studentSem),
        subjectId: offeringData.subjectId,
        offeringId,
        cgpaSnapshot,
        submittedAt: new Date().toISOString(),
        status: "pending",
      };

      transaction.set(appRef, newApp);
      transaction.update(offeringRef, {
        seatsFilled: seatsFilled + 1,
        updatedAt: new Date().toISOString(),
      });

      return newApp;
    });

    await syncFFCSOfferingLiveState(windowId, offeringId);
    return res.status(201).json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit FFCS application";
    return res.status(400).json({ error: msg });
  }
});

router.get("/teacher/ffcs/applications", requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const teacherOfferingsSnap = await adminDb.collection("ffcsOfferings").where("teacherId", "==", uid).get();
    if (teacherOfferingsSnap.empty) {
      return res.json([]);
    }

    const offeringIds = teacherOfferingsSnap.docs.map((d) => d.id);
    const offeringsMap = new Map(teacherOfferingsSnap.docs.map((d) => [d.id, d.data()]));

    const applicationsSnap = await adminDb.collection("ffcsApplications").get();
    const matchingApps = applicationsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() as any }))
      .filter((app) => offeringIds.includes(app.offeringId));

    const enriched = matchingApps.map((app) => {
      const offering = offeringsMap.get(app.offeringId);
      return {
        ...app,
        offeringName: offering ? `${offering.subjectName} (${offering.day} ${offering.startTime}–${offering.endTime})` : "Offering",
      };
    });

    return res.json(enriched);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch teacher applications";
    return res.status(500).json({ error: msg });
  }
});

router.patch("/teacher/ffcs/applications/:id/status", requireAuth, requireTeacher, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!["allocated", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const appRef = adminDb.collection("ffcsApplications").doc(id);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      return res.status(404).json({ error: "Application not found" });
    }

    const appData = appSnap.data() as any;
    const offeringRef = adminDb.collection("ffcsOfferings").doc(appData.offeringId);
    const offeringSnap = await offeringRef.get();

    if (!offeringSnap.exists) {
      return res.status(404).json({ error: "Offering not found" });
    }

    const offeringData = offeringSnap.data() as any;
    if (offeringData.teacherId !== uid) {
      return res.status(403).json({ error: "You are not authorized to manage this student selection" });
    }

    await appRef.update({ status, updatedAt: new Date().toISOString() });

    if (status === "allocated") {
      const allocRef = adminDb.collection("ffcsAllocations").doc(`${appData.windowId}_${appData.studentId}_${appData.subjectId}`);
      await allocRef.set({
        id: allocRef.id,
        windowId: appData.windowId,
        studentId: appData.studentId,
        subjectId: appData.subjectId,
        offeringId: appData.offeringId,
        priorityType: appData.semester === "1" ? "sem1_fcfs" : "sem2_cgpa",
        cgpaSnapshot: appData.cgpaSnapshot ?? null,
        allocatedAt: new Date().toISOString(),
      });
    }

    return res.json({ success: true, id, status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update application status";
    return res.status(500).json({ error: msg });
  }
});

export default router;
