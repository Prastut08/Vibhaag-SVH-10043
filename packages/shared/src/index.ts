import { z } from "zod";

export const CampusHubRoleSchema = z.enum(["admin", "teacher", "student"]);
export type CampusHubRole = z.infer<typeof CampusHubRoleSchema>;

export const RoleSchema = z.enum(["admin", "teacher", "student", "faculty", "staff"]);
export type Role = z.infer<typeof RoleSchema>;

export interface FirebaseUserPayload {
  id: string;
  uid: string;
  email: string | null;
  role?: CampusHubRole;
  status?: string;
}

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: RoleSchema,
});
export type User = z.infer<typeof UserSchema>;

export const AnnouncementSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  audience: z.enum(["all", "department", "batch"]),
  audienceRef: z.string().nullable(),
  authorId: z.string(),
  createdAt: z.string(),
});
export type Announcement = z.infer<typeof AnnouncementSchema>;

export const LeaveRequestSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  sessionId: z.string(),
  date: z.string(),
  reason: z.string(),
  status: z.enum(["pending", "approved", "denied"]),
  reviewerId: z.string().nullable(),
  createdAt: z.string(),
});
export type LeaveRequest = z.infer<typeof LeaveRequestSchema>;

export const FeedbackSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  studentId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
});
export type Department = z.infer<typeof DepartmentSchema>;

export const CourseSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  departmentId: z.string(),
});
export type Course = z.infer<typeof CourseSchema>;

export const BatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  year: z.number(),
  departmentId: z.string(),
});
export type Batch = z.infer<typeof BatchSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  courseId: z.string(),
  batchId: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
});
export type Session = z.infer<typeof SessionSchema>;

export const AttendanceSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  facultyId: z.string(),
  date: z.string(),
  status: z.enum(["checked-in", "checked-out", "missed"]),
  checkInAt: z.string().nullable(),
  checkOutAt: z.string().nullable(),
  durationMinutes: z.number().nullable(),
});
export type Attendance = z.infer<typeof AttendanceSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const TIMETABLE_SLOTS = [
  { id: "slot-1", startTime: "08:30", endTime: "10:00", label: "Slot 1 (08:30 - 10:00)" },
  { id: "slot-2", startTime: "10:05", endTime: "11:35", label: "Slot 2 (10:05 - 11:35)" },
  { id: "slot-3", startTime: "11:40", endTime: "13:10", label: "Slot 3 (11:40 - 13:10)" },
  { id: "slot-4", startTime: "13:15", endTime: "14:45", label: "Slot 4 (13:15 - 14:45)" },
  { id: "slot-5", startTime: "14:50", endTime: "16:20", label: "Slot 5 (14:50 - 16:20)" },
  { id: "slot-6", startTime: "16:25", endTime: "17:55", label: "Slot 6 (16:25 - 17:55)" },
  { id: "slot-7", startTime: "18:00", endTime: "19:30", label: "Slot 7 (18:00 - 19:30)" },
] as const;

export type TimetableSlot = (typeof TIMETABLE_SLOTS)[number];

export const FFCSWindowStatusSchema = z.enum(["scheduled", "open", "closed"]);
export type FFCSWindowStatus = z.infer<typeof FFCSWindowStatusSchema>;

export const FFCSWindowSchema = z.object({
  id: z.string(),
  semester: z.union([z.number(), z.string()]),
  academicYear: z.string(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  status: FFCSWindowStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FFCSWindow = z.infer<typeof FFCSWindowSchema>;

export const FFCSOfferingSchema = z.object({
  id: z.string(),
  windowId: z.string(),
  semester: z.union([z.number(), z.string()]),
  subjectId: z.string(),
  subjectCode: z.string().optional(),
  subjectName: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  day: z.string(),
  slotId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  capacity: z.number().min(1),
  seatsFilled: z.number().min(0),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FFCSOffering = z.infer<typeof FFCSOfferingSchema>;

export const FFCSApplicationStatusSchema = z.enum([
  "pending",
  "allocated",
  "rejected",
  "waitlisted",
  "cancelled",
]);
export type FFCSApplicationStatus = z.infer<typeof FFCSApplicationStatusSchema>;

export const FFCSApplicationSchema = z.object({
  id: z.string(),
  windowId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  semester: z.union([z.number(), z.string()]),
  subjectId: z.string(),
  offeringId: z.string(),
  cgpaSnapshot: z.number().nullable(),
  submittedAt: z.string(),
  status: FFCSApplicationStatusSchema,
});
export type FFCSApplication = z.infer<typeof FFCSApplicationSchema>;

export const FFCSAllocationSchema = z.object({
  id: z.string(),
  windowId: z.string(),
  studentId: z.string(),
  subjectId: z.string(),
  offeringId: z.string(),
  priorityType: z.enum(["sem1_fcfs", "sem2_cgpa"]),
  cgpaSnapshot: z.number().nullable(),
  allocatedAt: z.string(),
});
export type FFCSAllocation = z.infer<typeof FFCSAllocationSchema>;

export interface TeacherTimetableSlot {
  timetableId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  day: string;
  slotId: string;
  startTime: string;
  endTime: string;
  classId?: string;
  capacity?: number;
  seatsFilled?: number;
  semester?: string | number;
  section?: string;
}

export interface ClassModel {
  classId: string;
  offeringId: string;
  teacherId: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  day?: string;
  slotId?: string;
  startTime?: string;
  endTime?: string;
  studentIds: string[];
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}



