import { Router, Response } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin, AuthenticatedRequest } from "../middleware/auth";
import { adminAuth, adminDb } from "../lib/firebase-admin";

const router = Router();

const studentSchema = z.object({
  enrollmentNumber: z.string().min(1, "Enrollment number is required"),
  name: z.string().min(1, "Name is required"),
  branch: z.string().optional(),
  semester: z.union([z.string(), z.number()]).optional(),
  departmentId: z.string().optional(),
  batchId: z.string().optional(),
});

const studentUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  branch: z.string().optional(),
  semester: z.union([z.string(), z.number()]).optional(),
});

const teacherSchema = z.object({
  teacherIdentifier: z.string().min(1, "Teacher identifier is required"),
  name: z.string().min(1, "Name is required"),
  department: z.string().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
});

const teacherUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string().optional(),
  designation: z.string().optional(),
});

const branchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  code: z.string().min(1, "Branch code is required"),
  description: z.string().optional(),
});

/**
 * GET /admin/overview
 * Overview stats from Firestore collections.
 */
router.get("/overview", requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [studentsSnap, teachersSnap, branchesSnap] = await Promise.all([
      adminDb.collection("students").get(),
      adminDb.collection("teachers").get(),
      adminDb.collection("branches").get(),
    ]);

    return res.json({
      totalStudents: studentsSnap.size,
      totalTeachers: teachersSnap.size,
      totalBranches: branchesSnap.size,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch overview metrics";
    return res.status(500).json({ error: msg });
  }
});

/**
 * Branches Endpoints
 */
router.get("/branches", requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await adminDb.collection("branches").orderBy("createdAt", "desc").get();
    const branches = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json(branches);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch branches";
    return res.status(500).json({ error: msg });
  }
});

router.post("/branches", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = branchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid branch payload", details: parsed.error.format() });
  }

  const { name, code, description } = parsed.data;
  const cleanCode = code.trim().toUpperCase();

  try {
    const existingSnap = await adminDb.collection("branches").where("code", "==", cleanCode).get();
    if (!existingSnap.empty) {
      return res.status(409).json({ error: `Branch with code '${cleanCode}' already exists` });
    }

    const docRef = adminDb.collection("branches").doc();
    const branchData = {
      id: docRef.id,
      name: name.trim(),
      code: cleanCode,
      description: description?.trim() || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(branchData);
    return res.status(201).json(branchData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create branch";
    return res.status(500).json({ error: msg });
  }
});

router.put("/branches/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const parsed = branchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid branch payload", details: parsed.error.format() });
  }

  const { name, code, description } = parsed.data;
  const cleanCode = code.trim().toUpperCase();

  try {
    const docRef = adminDb.collection("branches").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Branch not found" });
    }

    // Check if another branch uses this code
    const existingSnap = await adminDb.collection("branches").where("code", "==", cleanCode).get();
    const conflicting = existingSnap.docs.find((d) => d.id !== id);
    if (conflicting) {
      return res.status(409).json({ error: `Another branch with code '${cleanCode}' already exists` });
    }

    const updateData = {
      name: name.trim(),
      code: cleanCode,
      description: description?.trim() || "",
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updateData);
    return res.json({ id, ...docSnap.data(), ...updateData });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update branch";
    return res.status(500).json({ error: msg });
  }
});

router.delete("/branches/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const docRef = adminDb.collection("branches").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Branch not found" });
    }

    const branchData = docSnap.data();
    const branchCode = branchData?.code;
    const branchName = branchData?.name;

    // Check students reference to this branch
    const studentsSnap = await adminDb.collection("students").get();
    const hasStudent = studentsSnap.docs.some((doc) => {
      const b = doc.data().branch;
      return b === branchCode || b === branchName || b === id;
    });

    if (hasStudent) {
      return res.status(400).json({ error: "Cannot delete branch with active students or teachers" });
    }

    // Check teachers reference to this branch
    const teachersSnap = await adminDb.collection("teachers").get();
    const hasTeacher = teachersSnap.docs.some((doc) => {
      const d = doc.data().department || doc.data().branch;
      return d === branchCode || d === branchName || d === id;
    });

    if (hasTeacher) {
      return res.status(400).json({ error: "Cannot delete branch with active students or teachers" });
    }

    await docRef.delete();
    return res.json({ success: true, message: "Branch deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete branch";
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /admin/students
 */
router.get("/students", requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await adminDb.collection("students").orderBy("createdAt", "desc").get();
    const students = snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    return res.json(students);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch students";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /admin/users/student
 */
router.post("/users/student", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = studentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid student payload", details: parsed.error.format() });
  }

  const { enrollmentNumber, name, branch, semester, departmentId, batchId } = parsed.data;
  const cleanEnrollment = enrollmentNumber.trim().toUpperCase();
  const generatedEmail = `${cleanEnrollment.toLowerCase()}@gmail.com`;
  const defaultPassword = "student123";

  try {
    const existingDoc = await adminDb.collection("students").where("enrollmentNumber", "==", cleanEnrollment).get();
    if (!existingDoc.empty) {
      return res.status(409).json({ error: `Student with enrollment number '${cleanEnrollment}' already exists` });
    }

    try {
      await adminAuth.getUserByEmail(generatedEmail);
      return res.status(409).json({ error: `Account with email '${generatedEmail}' already exists` });
    } catch {
      // User does not exist, proceed
    }

    const firebaseUser = await adminAuth.createUser({
      email: generatedEmail,
      password: defaultPassword,
      displayName: name,
    });

    try {
      await adminAuth.setCustomUserClaims(firebaseUser.uid, { role: "student" });

      const studentProfile = {
        uid: firebaseUser.uid,
        enrollmentNumber: cleanEnrollment,
        email: generatedEmail,
        name,
        role: "student",
        status: "active",
        branch: branch || null,
        semester: semester ? String(semester) : null,
        departmentId: departmentId || null,
        batchId: batchId || null,
        createdAt: new Date().toISOString(),
      };

      await adminDb.collection("users").doc(firebaseUser.uid).set(studentProfile);
      await adminDb.collection("students").doc(firebaseUser.uid).set(studentProfile);

      return res.status(201).json({
        success: true,
        message: "Student account provisioned successfully",
        credentials: {
          uid: firebaseUser.uid,
          enrollmentNumber: cleanEnrollment,
          email: generatedEmail,
          password: defaultPassword,
          role: "student",
        },
        student: studentProfile,
      });
    } catch (dbErr: unknown) {
      await adminAuth.deleteUser(firebaseUser.uid);
      const msg = dbErr instanceof Error ? dbErr.message : "Firestore document creation failed";
      return res.status(500).json({ error: `Failed to save student profile: ${msg}` });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create student account";
    return res.status(400).json({ error: msg });
  }
});

/**
 * PUT /admin/students/:id
 */
router.put("/students/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const parsed = studentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid student payload", details: parsed.error.format() });
  }

  const { name, branch, semester } = parsed.data;

  try {
    const studentRef = adminDb.collection("students").doc(id);
    const docSnap = await studentRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Student not found" });
    }

    const updates = {
      name,
      branch: branch || null,
      semester: semester ? String(semester) : null,
      updatedAt: new Date().toISOString(),
    };

    await studentRef.update(updates);
    await adminDb.collection("users").doc(id).update(updates).catch(() => {});
    await adminAuth.updateUser(id, { displayName: name }).catch(() => {});

    return res.json({ uid: id, ...docSnap.data(), ...updates });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update student";
    return res.status(500).json({ error: msg });
  }
});

/**
 * DELETE /admin/students/:id
 */
router.delete("/students/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const studentRef = adminDb.collection("students").doc(id);
    const docSnap = await studentRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Student not found" });
    }

    await studentRef.delete();
    await adminDb.collection("users").doc(id).delete().catch(() => {});
    await adminAuth.deleteUser(id).catch(() => {});

    return res.json({ success: true, message: "Student deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete student";
    return res.status(500).json({ error: msg });
  }
});

/**
 * GET /admin/teachers
 */
router.get("/teachers", requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const snap = await adminDb.collection("teachers").orderBy("createdAt", "desc").get();
    const teachers = snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    return res.json(teachers);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch teachers";
    return res.status(500).json({ error: msg });
  }
});

/**
 * POST /admin/users/teacher
 */
router.post("/users/teacher", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = teacherSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid teacher payload", details: parsed.error.format() });
  }

  const { teacherIdentifier, name, department, designation, departmentId } = parsed.data;
  const cleanIdentifier = teacherIdentifier.trim().toUpperCase();
  const generatedEmail = `${cleanIdentifier.toLowerCase()}@gmail.com`;
  const defaultPassword = "teacher123";

  try {
    const existingDoc = await adminDb.collection("teachers").where("teacherIdentifier", "==", cleanIdentifier).get();
    if (!existingDoc.empty) {
      return res.status(409).json({ error: `Teacher with identifier '${cleanIdentifier}' already exists` });
    }

    try {
      await adminAuth.getUserByEmail(generatedEmail);
      return res.status(409).json({ error: `Account with email '${generatedEmail}' already exists` });
    } catch {
      // User does not exist, proceed
    }

    const firebaseUser = await adminAuth.createUser({
      email: generatedEmail,
      password: defaultPassword,
      displayName: name,
    });

    try {
      await adminAuth.setCustomUserClaims(firebaseUser.uid, { role: "teacher" });

      const teacherProfile = {
        uid: firebaseUser.uid,
        teacherIdentifier: cleanIdentifier,
        email: generatedEmail,
        name,
        role: "teacher",
        status: "active",
        department: department || null,
        designation: designation || null,
        departmentId: departmentId || null,
        createdAt: new Date().toISOString(),
      };

      await adminDb.collection("users").doc(firebaseUser.uid).set(teacherProfile);
      await adminDb.collection("teachers").doc(firebaseUser.uid).set(teacherProfile);

      return res.status(201).json({
        success: true,
        message: "Teacher account provisioned successfully",
        credentials: {
          uid: firebaseUser.uid,
          teacherIdentifier: cleanIdentifier,
          email: generatedEmail,
          password: defaultPassword,
          role: "teacher",
        },
        teacher: teacherProfile,
      });
    } catch (dbErr: unknown) {
      await adminAuth.deleteUser(firebaseUser.uid);
      const msg = dbErr instanceof Error ? dbErr.message : "Firestore document creation failed";
      return res.status(500).json({ error: `Failed to save teacher profile: ${msg}` });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create teacher account";
    return res.status(400).json({ error: msg });
  }
});

/**
 * PUT /admin/teachers/:id
 */
router.put("/teachers/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const parsed = teacherUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid teacher payload", details: parsed.error.format() });
  }

  const { name, department, designation } = parsed.data;

  try {
    const teacherRef = adminDb.collection("teachers").doc(id);
    const docSnap = await teacherRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const updates = {
      name,
      department: department || null,
      designation: designation || null,
      updatedAt: new Date().toISOString(),
    };

    await teacherRef.update(updates);
    await adminDb.collection("users").doc(id).update(updates).catch(() => {});
    await adminAuth.updateUser(id, { displayName: name }).catch(() => {});

    return res.json({ uid: id, ...docSnap.data(), ...updates });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update teacher";
    return res.status(500).json({ error: msg });
  }
});

/**
 * DELETE /admin/teachers/:id
 */
router.delete("/teachers/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const teacherRef = adminDb.collection("teachers").doc(id);
    const docSnap = await teacherRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    await teacherRef.delete();
    await adminDb.collection("users").doc(id).delete().catch(() => {});
    await adminAuth.deleteUser(id).catch(() => {});

    return res.json({ success: true, message: "Teacher deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete teacher";
    return res.status(500).json({ error: msg });
  }
});

/**
 * PATCH /admin/users/:uid/status
 * Admin endpoint to toggle user account status (active vs inactive).
 */
router.patch("/users/:uid/status", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { uid } = req.params;
  const { status } = req.body;

  if (!status || !["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Must be 'active' or 'inactive'." });
  }

  try {
    const userRef = adminDb.collection("users").doc(uid);
    const docSnap = await userRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const role = docSnap.data()?.role;
    const updates = { status, updatedAt: new Date().toISOString() };

    await userRef.update(updates);
    if (role === "student") {
      await adminDb.collection("students").doc(uid).update(updates).catch(() => {});
    } else if (role === "teacher") {
      await adminDb.collection("teachers").doc(uid).update(updates).catch(() => {});
    } else if (role === "admin") {
      await adminDb.collection("admins").doc(uid).update(updates).catch(() => {});
    }

    return res.json({ success: true, uid, status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update account status";
    return res.status(500).json({ error: msg });
  }
});

export default router;
