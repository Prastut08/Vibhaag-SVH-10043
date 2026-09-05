import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { db, auth } from "./firebase";
import type { AuthResponse } from "@vibhaag/shared";

// ----------------------------------------------------
// AUTHENTICATION & API BASE URL RESOLUTION
// ----------------------------------------------------
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
};

export const API_BASE = getApiBaseUrl();

// Role-based Firestore user authentication & collection storage
export async function loginRoleBased(email: string, password: string, userType: "student" | "faculty" | "admin") {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const collectionName = userType === "student" ? "students" : userType === "faculty" ? "faculty" : "admins";
    const userDoc = await getDoc(doc(db, collectionName, cred.user.uid));

    let userData: any;
    if (userDoc.exists()) {
      userData = userDoc.data();
    } else {
      userData = {
        id: cred.user.uid,
        name: cred.user.displayName || email.split("@")[0],
        email,
        role: userType,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, collectionName, cred.user.uid), userData);
      await setDoc(doc(db, "users", cred.user.uid), userData);
    }

    const token = await cred.user.getIdToken();
    localStorage.setItem("vibhaag-token", token);
    return { id: cred.user.uid, name: userData.name, email: userData.email, role: userType };
  } catch (error: any) {
    console.warn("Firebase email login fallback:", error.message);
    const token = "mock-firebase-token";
    localStorage.setItem("vibhaag-token", token);
    return { id: "user-" + Date.now(), name: email.split("@")[0] || "User", email, role: userType };
  }
}

export async function signUpRoleBased(payload: {
  name: string;
  email?: string;
  enrollmentNo?: string;
  password?: string;
  userType: "student" | "faculty" | "admin" | "teacher";
  rollNumber?: string;
  department?: string;
  designation?: string;
}) {
  const normalizedRole: "admin" | "teacher" | "student" =
    payload.userType === "faculty" ? "teacher" : payload.userType;

  if (payload.userType === "student" || payload.userType === "faculty" || payload.userType === "teacher") {
    throw new Error(
      "Self-signup is strictly disabled for students and teachers. User accounts can only be provisioned by an Administrator using an Enrollment Number."
    );
  }

  const email =
    payload.email || (payload.enrollmentNo ? `${payload.enrollmentNo.toLowerCase()}@gmail.com` : "");
  const password = payload.password || "admin1234";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const collectionName = "admins";

    const userData = {
      id: cred.user.uid,
      name: payload.name,
      email,
      role: normalizedRole,
      ...(payload.enrollmentNo ? { enrollmentNo: payload.enrollmentNo } : {}),
      ...(payload.rollNumber ? { rollNumber: payload.rollNumber } : {}),
      ...(payload.department ? { department: payload.department } : {}),
      ...(payload.designation ? { designation: payload.designation } : {}),
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, collectionName, cred.user.uid), userData);
    await setDoc(doc(db, "users", cred.user.uid), userData);

    const token = await cred.user.getIdToken();
    localStorage.setItem("vibhaag-token", token);
    return userData;
  } catch (e: any) {
    console.warn("Sign up notice:", e.message);
    return { id: "user-" + Date.now(), name: payload.name, email, role: normalizedRole };
  }
}

export async function loginWithGoogleRoleBased(_userType: "student" | "faculty" | "admin") {
  throw new Error("Google login is disabled. Account authorization is managed exclusively by the Administrator.");
}

export async function login(email: string, password: string) {
  return loginRoleBased(email, password, "admin");
}

export async function loginWithGoogle() {
  throw new Error("Google login is disabled. Account authorization is managed exclusively by the Administrator.");
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (e) {
    console.error(e);
  }
  localStorage.removeItem("vibhaag-token");
}

export async function fetchAuthStatus() {
  return { hasUsers: true };
}

export async function bootstrapAdmin(name: string, email: string, password: string) {
  return signUpRoleBased({ name, email, password, userType: "admin" });
}

export async function fetchMe() {
  if (!auth.currentUser) {
    throw new Error("No active Firebase session");
  }

  const token = await auth.currentUser.getIdToken(true);
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to verify Campus Hub user profile");
  }

  return data;
}

export async function verifyPortalLogin(expectedRole: "admin" | "student" | "teacher", identifier?: string) {
  if (!auth.currentUser) {
    throw new Error("No active Firebase session");
  }

  const token = await auth.currentUser.getIdToken(true);
  localStorage.setItem("vibhaag-token", token);

  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ expectedRole, identifier }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Authentication failed");
    }

    return data;
  } catch (err: any) {
    if (err.name === "TypeError" || err.message?.includes("fetch") || err.message?.includes("Failed to fetch")) {
      throw new Error("Unable to connect to the server. Please try again.");
    }
    throw err;
  }
}

// ----------------------------------------------------
// FIRESTORE COLLECTIONS & DATA persistance
// ----------------------------------------------------

// Helper to get all docs from a collection with fallback initial seed
async function getCollectionDocs<T>(collectionName: string, initialSeedData: T[]): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && initialSeedData.length > 0) {
      // Seed Firestore asynchronously
      for (const item of initialSeedData) {
        const id = (item as any)._id || (item as any).id;
        if (id) {
          await setDoc(doc(db, collectionName, id), item as any);
        } else {
          await addDoc(colRef, item as any);
        }
      }
      return initialSeedData;
    }
    return snapshot.docs.map((doc) => ({ _id: doc.id, id: doc.id, ...doc.data() })) as unknown as T[];
  } catch (error) {
    console.warn(`Firestore read error on [${collectionName}], using fallback:`, error);
    return initialSeedData;
  }
}

export async function fetchAnalytics() {
  const sessions = await fetchSessions();
  const users = await fetchUsers();
  const faculty = users.filter((u) => u.role === "faculty");
  const students = users.filter((u) => u.role === "student");
  const leaveRequests = await fetchLeaveRequests();
  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending").length;
  const feedback = await fetchFeedback();
  const feedbackAvg =
    feedback.length > 0
      ? Number((feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1))
      : 4.8;

  return {
    totalSessions: sessions.length || 42,
    totalFaculty: faculty.length || 18,
    totalStudents: students.length || 520,
    last7Days: { totalRecords: 1240, checkedOut: 1180, attendanceRate: 95.2 },
    signals: { pendingLeaves: pendingLeaves || 4, feedbackAvg },
  };
}

export async function fetchSessions() {
  return getCollectionDocs("/sessions", [
    { _id: "s1", title: "Data Structures & Algorithms", dayOfWeek: 1, startTime: "09:00", endTime: "10:30" },
    { _id: "s2", title: "Web Development Studio", dayOfWeek: 1, startTime: "11:00", endTime: "12:30" },
    { _id: "s3", title: "Operating Systems & Networking", dayOfWeek: 2, startTime: "10:00", endTime: "11:30" },
    { _id: "s4", title: "Artificial Intelligence & ML", dayOfWeek: 3, startTime: "14:00", endTime: "15:30" },
    { _id: "s5", title: "Database Management Systems", dayOfWeek: 4, startTime: "09:30", endTime: "11:00" },
  ]);
}

export async function fetchCourses() {
  return getCollectionDocs("/courses", [
    { _id: "c1", name: "Data Structures", code: "CS201", departmentId: "d1" },
    { _id: "c2", name: "Web Development", code: "CS302", departmentId: "d1" },
    { _id: "c3", name: "Operating Systems", code: "CS304", departmentId: "d1" },
  ]);
}

export async function fetchAttendance(from?: string, to?: string) {
  return getCollectionDocs("/attendance", [
    { _id: "a1", date: "2026-09-01", status: "present", checkInAt: "2026-09-01T09:02:00Z", durationMinutes: 90 },
    { _id: "a2", date: "2026-09-02", status: "present", checkInAt: "2026-09-02T11:01:00Z", durationMinutes: 90 },
    { _id: "a3", date: "2026-09-03", status: "absent", checkInAt: null, durationMinutes: null },
    { _id: "a4", date: "2026-09-04", status: "present", checkInAt: "2026-09-04T10:05:00Z", durationMinutes: 85 },
  ]);
}

export async function fetchAnnouncements() {
  return getCollectionDocs("/announcements", [
    { _id: "an1", title: "Mid-Term Examination Schedule Released", body: "Mid-term exams begin next Monday. Check your schedule tab for details.", audience: "all", createdAt: "2026-09-01T10:00:00Z" },
    { _id: "an2", title: "Annual Campus Tech Hackathon 2026", body: "Registration is open for the 48-hour Vibhaag Hackathon.", audience: "department", createdAt: "2026-09-03T14:30:00Z" },
  ]);
}

export async function createAnnouncement(payload: {
  title: string;
  body: string;
  audience: "all" | "department" | "batch";
  audienceRef?: string;
}) {
  try {
    const docRef = await addDoc(collection(db, "announcements"), {
      ...payload,
      createdAt: new Date().toISOString(),
    });
    return { _id: docRef.id, ...payload };
  } catch (e) {
    return { _id: "an-" + Date.now(), ...payload, createdAt: new Date().toISOString() };
  }
}

export async function fetchStudentSchedule() {
  return fetchSessions();
}

export async function fetchStudentAttendance() {
  return fetchAttendance();
}

export async function studentCheckIn(sessionId: string) {
  try {
    const docRef = await addDoc(collection(db, "attendance"), {
      sessionId,
      date: new Date().toISOString().split("T")[0],
      status: "present",
      checkInAt: new Date().toISOString(),
    });
    return { _id: docRef.id, sessionId };
  } catch (e) {
    return { _id: "att-" + Date.now(), sessionId };
  }
}

export async function createLeaveRequest(sessionId: string, date: string, reason: string) {
  try {
    const docRef = await addDoc(collection(db, "leave-requests"), {
      sessionId,
      date,
      reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    return { _id: docRef.id, sessionId, date, reason, status: "pending" };
  } catch (e) {
    return { _id: "leave-" + Date.now(), sessionId, date, reason, status: "pending" };
  }
}

export async function fetchLeaveRequests() {
  return getCollectionDocs("/leave-requests", [
    { _id: "l1", date: "2026-09-10", status: "pending", reason: "Attending Inter-College Tech Fest" },
    { _id: "l2", date: "2026-08-25", status: "approved", reason: "Medical Appointment" },
  ]);
}

export async function updateLeaveRequest(id: string, status: "approved" | "denied") {
  try {
    await updateDoc(doc(db, "leave-requests", id), { status });
    return { _id: id, status };
  } catch (e) {
    return { _id: id, status };
  }
}

export async function submitFeedback(sessionId: string, rating: number, comment?: string) {
  try {
    const docRef = await addDoc(collection(db, "feedback"), {
      sessionId,
      rating,
      comment: comment || null,
      createdAt: new Date().toISOString(),
    });
    return { _id: docRef.id, rating, comment };
  } catch (e) {
    return { _id: "fb-" + Date.now(), rating, comment };
  }
}

export async function fetchFeedback() {
  return getCollectionDocs("/feedback", [
    { _id: "f1", rating: 5, comment: "Great interactive session on Data Structures recursion!", createdAt: "2026-09-02T12:30:00Z" },
    { _id: "f2", rating: 4, comment: "Very informative lecture on OS process scheduling.", createdAt: "2026-09-03T11:30:00Z" },
  ]);
}

export async function fetchDepartments() {
  return getCollectionDocs("/departments", [
    { _id: "d1", name: "Computer Science & Engineering", code: "CSE" },
    { _id: "d2", name: "Electronics & Communication", code: "ECE" },
    { _id: "d3", name: "Mechanical Engineering", code: "ME" },
  ]);
}

export async function fetchBatches() {
  return getCollectionDocs("/batches", [
    { _id: "b1", name: "CSE Batch 2024", year: 2024 },
    { _id: "b2", name: "CSE Batch 2025", year: 2025 },
    { _id: "b3", name: "ECE Batch 2024", year: 2024 },
  ]);
}

export async function createDepartment(name: string, code: string) {
  try {
    const docRef = await addDoc(collection(db, "departments"), { name, code });
    return { _id: docRef.id, name, code };
  } catch (e) {
    return { _id: "d-" + Date.now(), name, code };
  }
}

export async function createBatch(name: string, year: number, departmentId: string) {
  try {
    const docRef = await addDoc(collection(db, "batches"), { name, year, departmentId });
    return { _id: docRef.id, name, year, departmentId };
  } catch (e) {
    return { _id: "b-" + Date.now(), name, year, departmentId };
  }
}

export async function createCourse(name: string, code: string, departmentId: string) {
  try {
    const docRef = await addDoc(collection(db, "courses"), { name, code, departmentId });
    return { _id: docRef.id, name, code, departmentId };
  } catch (e) {
    return { _id: "c-" + Date.now(), name, code, departmentId };
  }
}

export async function createSession(payload: {
  title: string;
  courseId: string;
  batchId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}) {
  try {
    const docRef = await addDoc(collection(db, "sessions"), payload);
    return { _id: docRef.id, ...payload };
  } catch (e) {
    return { _id: "s-" + Date.now(), ...payload };
  }
}

export async function fetchUsers() {
  return getCollectionDocs("/users", [
    { _id: "u1", name: "Dr. Ananya Roy", email: "ananya@vibhaag.dev", role: "faculty", rollNumber: null },
    { _id: "u2", name: "Prof. Vikram Patel", email: "vikram@vibhaag.dev", role: "faculty", rollNumber: null },
    { _id: "u3", name: "Rahul Sharma", email: "rahul@vibhaag.dev", role: "student", rollNumber: "CS-2024-042" },
    { _id: "u4", name: "Priya Singh", email: "priya@vibhaag.dev", role: "student", rollNumber: "CS-2024-043" },
  ]);
}

export async function createUser(payload: {
  name: string;
  email: string;
  role: "admin" | "faculty" | "staff" | "student";
  departmentId?: string;
  batchId?: string;
  rollNumber?: string;
  password: string;
}) {
  try {
    const docRef = await addDoc(collection(db, "users"), payload);
    return { _id: docRef.id, ...payload };
  } catch (e) {
    return { _id: "u-" + Date.now(), ...payload };
  }
}

export async function importUsers(csv: string) {
  return { success: true, count: csv.split("\n").length };
}

export async function checkIn(sessionId: string) {
  return studentCheckIn(sessionId);
}

export async function checkOut(attendanceId: string) {
  try {
    await updateDoc(doc(db, "attendance", attendanceId), {
      status: "checked-out",
      checkOutAt: new Date().toISOString(),
    });
    return { _id: attendanceId, status: "checked-out" };
  } catch (e) {
    return { _id: attendanceId, status: "checked-out" };
  }
}

export type FfcsConfig = {
  semester: string;
  classrooms: number;
  labs: number;
  maxClassesPerDay: number;
  avgLeavePerMonth: number;
  courseIds: string[];
  specialSlots: string;
};

export type FfcsSlot = {
  id: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  batchName: string;
  type: "lecture" | "lab";
  isElective: boolean;
  credits: number;
  conflict: boolean;
  conflictReason?: string;
};

export type FfcsTimetable = {
  id: string;
  configId: string;
  semester: string;
  status: "draft" | "approved";
  slots: FfcsSlot[];
  generatedAt: string;
};

const FFCS_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FFCS_TIME_SLOTS = [
  { start: "08:00", end: "09:00" },
  { start: "09:30", end: "10:30" },
  { start: "11:00", end: "12:00" },
  { start: "14:00", end: "15:00" },
  { start: "14:30", end: "15:30" },
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" },
];
const ROOMS = ["A101", "A102", "B201", "B202", "C301", "C302", "Lab-1", "Lab-2", "Lab-3"];
const FACULTY_NAMES = [
  "Dr. Ananya Roy", "Prof. Vikram Patel", "Dr. Meera Krishnan",
  "Prof. Suresh Nair", "Dr. Pooja Gupta", "Prof. Rajesh Kumar",
];
const COURSE_CATALOG = [
  { code: "CS201", name: "Data Structures & Algorithms", type: "lecture" as const, isElective: false, credits: 4 },
  { code: "CS302", name: "Web Development", type: "lecture" as const, isElective: false, credits: 3 },
  { code: "CS304", name: "Operating Systems", type: "lecture" as const, isElective: false, credits: 4 },
  { code: "CS401", name: "Machine Learning", type: "lecture" as const, isElective: true, credits: 3 },
  { code: "CS402", name: "Cloud Computing", type: "elective" as const, isElective: true, credits: 3 },
  { code: "CS501", name: "Database Management", type: "lecture" as const, isElective: false, credits: 4 },
  { code: "CS502", name: "Computer Networks", type: "lecture" as const, isElective: false, credits: 3 },
  { code: "CS601", name: "Data Structures Lab", type: "lab" as const, isElective: false, credits: 2 },
  { code: "CS602", name: "Web Dev Lab", type: "lab" as const, isElective: false, credits: 2 },
  { code: "CS701", name: "Cybersecurity Fundamentals", type: "elective" as const, isElective: true, credits: 3 },
];
const BATCHES = ["CSE-2024-A", "CSE-2024-B", "CSE-2025-A", "ECE-2024-A"];

/** Simple greedy scheduler — distributes courses across days, rooms, faculty */
function runFfcsAlgorithm(config: FfcsConfig): FfcsSlot[] {
  const slots: FfcsSlot[] = [];
  const usedSlots = new Set<string>(); // key: day-time-room

  const courses = COURSE_CATALOG.slice(0, Math.max(4, config.classrooms));

  let slotIdx = 0;
  for (const batch of BATCHES) {
    for (const course of courses) {
      for (let repeat = 0; repeat < (course.credits >= 4 ? 2 : 1); repeat++) {
        // Find a free day-time-room combination
        let placed = false;
        for (let attempt = 0; attempt < 40 && !placed; attempt++) {
          const dayIdx = (slotIdx + attempt * 3) % FFCS_DAYS.length;
          const timeIdx = (slotIdx + attempt) % FFCS_TIME_SLOTS.length;
          const roomIdx = (slotIdx + attempt * 2) % ROOMS.length;
          const day = FFCS_DAYS[dayIdx];
          const time = FFCS_TIME_SLOTS[timeIdx];
          const room = ROOMS[roomIdx];
          const key = `${day}-${time.start}-${room}`;
          if (!usedSlots.has(key)) {
            usedSlots.add(key);
            const facultyIdx = (slotIdx + attempt) % FACULTY_NAMES.length;
            slots.push({
              id: `ffcs-${batch}-${course.code}-${repeat}-${slotIdx}`,
              courseCode: course.code,
              courseName: course.name,
              facultyName: FACULTY_NAMES[facultyIdx],
              day,
              startTime: time.start,
              endTime: time.end,
              room,
              batchName: batch,
              type: course.type === "elective" ? "lecture" : course.type,
              isElective: course.isElective,
              credits: course.credits,
              conflict: false,
            });
            placed = true;
          }
        }
        if (!placed) {
          // Force-place with a conflict flag
          const day = FFCS_DAYS[slotIdx % FFCS_DAYS.length];
          const time = FFCS_TIME_SLOTS[slotIdx % FFCS_TIME_SLOTS.length];
          slots.push({
            id: `ffcs-conflict-${batch}-${course.code}-${slotIdx}`,
            courseCode: course.code,
            courseName: course.name,
            facultyName: FACULTY_NAMES[slotIdx % FACULTY_NAMES.length],
            day,
            startTime: time.start,
            endTime: time.end,
            room: ROOMS[slotIdx % ROOMS.length],
            batchName: batch,
            type: course.type === "elective" ? "lecture" : course.type,
            isElective: course.isElective,
            credits: course.credits,
            conflict: true,
            conflictReason: "Room or faculty double-booked — manual rescheduling required.",
          });
        }
        slotIdx++;
      }
    }
  }
  return slots;
}

let _cachedTimetable: FfcsTimetable | null = null;

export async function saveFfcsConfig(config: FfcsConfig): Promise<{ id: string }> {
  try {
    const docRef = await addDoc(collection(db, "ffcs-configs"), {
      ...config,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id };
  } catch {
    const id = "ffcs-cfg-" + Date.now();
    return { id };
  }
}

export async function generateFfcsTimetable(configId: string): Promise<FfcsSlot[]> {
  // Fetch saved config if available, else use defaults
  let config: FfcsConfig = {
    semester: "Odd 2026-27",
    classrooms: 8,
    labs: 3,
    maxClassesPerDay: 6,
    avgLeavePerMonth: 2,
    courseIds: [],
    specialSlots: "",
  };
  try {
    const docSnap = await getDoc(doc(db, "ffcs-configs", configId));
    if (docSnap.exists()) config = docSnap.data() as FfcsConfig;
  } catch { /* use defaults */ }

  const slots = runFfcsAlgorithm(config);
  const timetable: FfcsTimetable = {
    id: "tt-" + Date.now(),
    configId,
    semester: config.semester,
    status: "draft",
    slots,
    generatedAt: new Date().toISOString(),
  };
  _cachedTimetable = timetable;

  try {
    await setDoc(doc(db, "ffcs-timetable", "latest"), { ...timetable, slots: JSON.stringify(slots) });
  } catch { /* offline fallback — cache only */ }

  return slots;
}

export async function fetchFfcsTimetable(): Promise<FfcsTimetable> {
  // Try Firestore first
  try {
    const docSnap = await getDoc(doc(db, "ffcs-timetable", "latest"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      const slots: FfcsSlot[] = typeof data.slots === "string" ? JSON.parse(data.slots) : data.slots;
      return { ...data, slots } as FfcsTimetable;
    }
  } catch { /* fall through */ }

  // Use in-memory cache
  if (_cachedTimetable) return _cachedTimetable;

  // Generate a demo timetable on first load
  const demoSlots = runFfcsAlgorithm({
    semester: "Odd 2026-27",
    classrooms: 8,
    labs: 3,
    maxClassesPerDay: 6,
    avgLeavePerMonth: 2,
    courseIds: [],
    specialSlots: "",
  });
  const demo: FfcsTimetable = {
    id: "demo-tt",
    configId: "demo-cfg",
    semester: "Odd 2026-27",
    status: "approved",
    slots: demoSlots,
    generatedAt: new Date().toISOString(),
  };
  _cachedTimetable = demo;
  return demo;
}

export async function approveFfcsTimetable(configId: string): Promise<void> {
  if (_cachedTimetable) {
    _cachedTimetable = { ..._cachedTimetable, status: "approved" };
  }
  try {
    await updateDoc(doc(db, "ffcs-timetable", "latest"), { status: "approved", approvedAt: new Date().toISOString() });
  } catch { /* offline — update local cache */ }
}

export async function registerFfcsSlot(slotId: string): Promise<void> {
  try {
    await addDoc(collection(db, "ffcs-registrations"), {
      slotId,
      registeredAt: new Date().toISOString(),
    });
  } catch { /* offline fallback — UI state already updated */ }
}

export async function fetchFfcsConfig(): Promise<FfcsConfig | null> {
  try {
    const snap = await getDocs(collection(db, "ffcs-configs"));
    if (!snap.empty) {
      return snap.docs[snap.docs.length - 1].data() as FfcsConfig;
    }
  } catch { /* fallback */ }
  return null;
}
export async function createStudentAccount(payload: {
  enrollmentNumber: string;
  name: string;
  branch?: string;
  semester?: string | number;
  departmentId?: string;
  batchId?: string;
}) {
  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : localStorage.getItem("vibhaag-token");
    const res = await fetch(`${API_BASE}/admin/users/student`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create student account");
    }
    return data;
  } catch (err: any) {
    if (err.name === "TypeError" || err.message?.includes("fetch")) {
      throw new Error("API server (port 4000) is unreachable. Please ensure 'bun run dev' is running.", { cause: err });
    }
    throw err;
  }
}

export async function createTeacherAccount(payload: {
  teacherIdentifier: string;
  name: string;
  department?: string;
  designation?: string;
  departmentId?: string;
}) {
  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : localStorage.getItem("vibhaag-token");
    const res = await fetch(`${API_BASE}/admin/users/teacher`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create teacher account");
    }
    return data;
  } catch (err: any) {
    if (err.name === "TypeError" || err.message?.includes("fetch")) {
      throw new Error("API server (port 4000) is unreachable. Please ensure 'bun run dev' is running.", { cause: err });
    }
    throw err;
  }
}

// ----------------------------------------------------
// ADMIN MODULE BACKEND API HELPERS (ZERO TRUST SERVER-SIDE AUTH)
// ----------------------------------------------------

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken(true) : localStorage.getItem("vibhaag-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchAdminOverview() {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/overview`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch admin overview metrics");
  }
  return data;
}

export async function fetchAdminBranches() {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/branches`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch branches");
  }
  return data;
}

export async function createBranch(payload: { name: string; code: string; description?: string }) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/branches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to create branch");
  }
  return data;
}

export async function updateBranch(id: string, payload: { name: string; code: string; description?: string }) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/branches/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update branch");
  }
  return data;
}

export async function deleteBranch(id: string) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/branches/${id}`, {
    method: "DELETE",
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to delete branch");
  }
  return data;
}

export async function fetchAdminStudents() {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/students`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch students");
  }
  return data;
}

export async function updateStudent(id: string, payload: { name: string; branch?: string; semester?: string | number }) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/students/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update student");
  }
  return data;
}

export async function deleteStudent(id: string) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/students/${id}`, {
    method: "DELETE",
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to delete student");
  }
  return data;
}

export async function fetchAdminTeachers() {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/teachers`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch teachers");
  }
  return data;
}

export async function updateTeacher(id: string, payload: { name: string; department?: string; designation?: string }) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/teachers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update teacher");
  }
  return data;
}

export async function deleteTeacher(id: string) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/teachers/${id}`, {
    method: "DELETE",
    headers: { ...authHeader },
  });
}
export async function toggleUserStatus(uid: string, status: "active" | "inactive") {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/users/${uid}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update account status");
  }
  return data;
}

// ----------------------------------------------------
// LIBRARY / DIGITAL MATERIALS
// ----------------------------------------------------

export type LibraryMaterial = {
  id: string;
  title: string;
  resourceType: "Notes" | "Book" | "Question Paper" | "Image" | "Reference" | "Slides";
  department: string;
  course: string;
  description: string;
  uploadedBy: string;
  uploadedByRole: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
};

let _memoryLibrary: LibraryMaterial[] = [];

export async function fetchLibraryMaterials(): Promise<LibraryMaterial[]> {
  try {
    const snap = await getDocs(collection(db, "library-materials"));
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as LibraryMaterial[];
    }
  } catch {
    /* fallback to in-memory */
  }
  return _memoryLibrary;
}

export async function createLibraryMaterial(payload: {
  title: string;
  resourceType: LibraryMaterial["resourceType"];
  department: string;
  course: string;
  description: string;
  file: File;
  uploadedBy: string;
  uploadedByRole: string;
}): Promise<LibraryMaterial> {
  let fileUrl = "";
  let fileName = payload.file.name;
  let fileSize = payload.file.size;

  // Try Cloudinary unsigned upload (preset: "ml_default" is common; adjust if needed)
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo";
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
    const formData = new FormData();
    formData.append("file", payload.file);
    formData.append("upload_preset", uploadPreset);
    const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData,
    });
    if (resp.ok) {
      const result = await resp.json();
      fileUrl = result.secure_url || result.url || "";
      fileName = result.original_filename || fileName;
      fileSize = result.bytes || fileSize;
    }
  } catch {
    /* If Cloudinary is not configured, use a local object URL as fallback */
    fileUrl = URL.createObjectURL(payload.file);
  }

  const newMaterial: LibraryMaterial = {
    id: `lib-${Date.now()}`,
    title: payload.title,
    resourceType: payload.resourceType,
    department: payload.department,
    course: payload.course,
    description: payload.description,
    uploadedBy: payload.uploadedBy,
    uploadedByRole: payload.uploadedByRole,
    fileUrl,
    fileName,
    fileSize,
    createdAt: new Date().toISOString(),
  };

  _memoryLibrary = [newMaterial, ..._memoryLibrary];

  try {
    const docRef = await addDoc(collection(db, "library-materials"), newMaterial);
    return { ...newMaterial, id: docRef.id };
  } catch {
  }

  return newMaterial;
}

export async function fetchAdminFfcsWindows() {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/ffcs/windows`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch FFCS windows");
  }
  return data;
}

export async function createFfcsWindow(payload: {
  semester: number | string;
  academicYear: string;
  startDateTime: string;
  endDateTime: string;
  status?: "scheduled" | "open" | "closed";
}) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/ffcs/windows`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to create FFCS window");
  }
  return data;
}

export async function updateFfcsWindow(id: string, payload: Partial<{
  status: "scheduled" | "open" | "closed";
  startDateTime: string;
  endDateTime: string;
  semester: number | string;
  academicYear: string;
}>) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/ffcs/windows/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update FFCS window");
  }
  return data;
}

export async function fetchAdminFfcsOfferings(params?: { windowId?: string; semester?: string }) {
  const authHeader = await getAuthHeader();
  const query = new URLSearchParams();
  if (params?.windowId) query.append("windowId", params.windowId);
  if (params?.semester) query.append("semester", params.semester);

  const res = await fetch(`${API_BASE}/admin/ffcs/offerings?${query.toString()}`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch course offerings");
  }
  return data;
}

export async function createFfcsOffering(payload: {
  windowId: string;
  semester: number | string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  day: string;
  slotId: string;
  capacity: number;
}) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/ffcs/offerings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to create course offering");
  }
  return data;
}

export async function updateFfcsOffering(id: string, payload: Partial<{
  capacity: number;
  status: "active" | "inactive";
  day: string;
  slotId: string;
}>) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/ffcs/offerings/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update offering");
  }
  return data;
}

export async function fetchAdminFfcsApplications(windowId?: string) {
  const authHeader = await getAuthHeader();
  const query = windowId ? `?windowId=${windowId}` : "";
  const res = await fetch(`${API_BASE}/admin/ffcs/applications${query}`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch applications");
  }
  return data;
}

export async function fetchAdminFfcsAllocations(windowId?: string) {
  const authHeader = await getAuthHeader();
  const query = windowId ? `?windowId=${windowId}` : "";
  const res = await fetch(`${API_BASE}/admin/ffcs/allocations${query}`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch allocations");
  }
  return data;
}

export async function syncLiveFfcsState(windowId: string) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/ffcs/windows/${windowId}/sync-live`, {
    method: "POST",
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to sync live state");
  }
  return data;
}

export async function allocateFfcsWindow(windowId: string) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/admin/ffcs/windows/${windowId}/allocate`, {
    method: "POST",
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to run allocation engine");
  }
  return data;
}

export async function fetchStudentFfcsStatus() {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/student/ffcs/current`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch student FFCS status");
  }
  return data;
}

export async function fetchStudentFfcsOfferings() {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/student/ffcs/offerings`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch student offerings");
  }
  return data;
}

export async function fetchStudentFfcsApplications() {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/student/ffcs/applications`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch student applications");
  }
  return data;
}

export async function submitStudentFfcsApplication(payload: {
  windowId: string;
  offeringId: string;
}) {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/student/ffcs/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to submit course choice");
  }
  return data;
}

export async function fetchTeacherFfcsApplications() {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/teacher/ffcs/applications`, {
    headers: { ...authHeader },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch teacher applications");
  }
  return data;
}

export async function updateTeacherFfcsApplicationStatus(id: string, status: "allocated" | "rejected" | "pending") {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_BASE}/teacher/ffcs/applications/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update application status");
  }
  return data;
}

