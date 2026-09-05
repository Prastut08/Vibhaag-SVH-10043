import { useEffect, useState } from "react";
import {
  fetchAdminFfcsWindows,
  createFfcsWindow,
  updateFfcsWindow,
  fetchAdminFfcsOfferings,
  createFfcsOffering,
  updateFfcsOffering,
  fetchAdminFfcsApplications,
  allocateFfcsWindow,
  fetchAdminFfcsAllocations,
  syncLiveFfcsState,
  fetchCourses,
  fetchAdminTeachers,
} from "../lib/api";
import { TIMETABLE_SLOTS, FFCSWindow, FFCSOffering, FFCSApplication, FFCSAllocation } from "@vibhaag/shared";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FfcsAdminPage() {
  const [activeTab, setActiveTab] = useState<"windows" | "offerings" | "applications" | "allocations">("windows");

  const [windows, setWindows] = useState<FFCSWindow[]>([]);
  const [offerings, setOfferings] = useState<FFCSOffering[]>([]);
  const [applications, setApplications] = useState<FFCSApplication[]>([]);
  const [allocations, setAllocations] = useState<FFCSAllocation[]>([]);
  const [courses, setCourses] = useState<{ id?: string; _id?: string; name: string; code: string }[]>([]);
  const [teachers, setTeachers] = useState<{ uid?: string; id?: string; name: string }[]>([]);

  const [selectedWindowId, setSelectedWindowId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [syncingRtdb, setSyncingRtdb] = useState(false);

  const [winSem, setWinSem] = useState("1");
  const [winYear, setWinYear] = useState("2026-27");
  const [winStart, setWinStart] = useState("");
  const [winEnd, setWinEnd] = useState("");
  const [winStatus, setWinStatus] = useState<"scheduled" | "open" | "closed">("scheduled");
  const [submittingWindow, setSubmittingWindow] = useState(false);

  const [offSubjectId, setOffSubjectId] = useState("");
  const [offTeacherId, setOffTeacherId] = useState("");
  const [offDay, setOffDay] = useState("Monday");
  const [offSlotId, setOffSlotId] = useState<string>(TIMETABLE_SLOTS[0].id);
  const [offCapacity, setOffCapacity] = useState("60");
  const [submittingOffering, setSubmittingOffering] = useState(false);

  const [filterSem, setFilterSem] = useState("all");
  const [filterTeacher, setFilterTeacher] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");

  const [allocating, setAllocating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [winList, courseList, teacherList] = await Promise.all([
        fetchAdminFfcsWindows().catch(() => []),
        fetchCourses().catch(() => []),
        fetchAdminTeachers().catch(() => []),
      ]);

      setWindows(winList);
      setCourses(courseList);
      setTeachers(teacherList);

      let targetWinId = selectedWindowId;
      if (!targetWinId && winList.length > 0) {
        targetWinId = winList[0].id;
        setSelectedWindowId(targetWinId);
      }

      if (targetWinId) {
        const [offList, appList, allocList] = await Promise.all([
          fetchAdminFfcsOfferings({ windowId: targetWinId }).catch(() => []),
          fetchAdminFfcsApplications(targetWinId).catch(() => []),
          fetchAdminFfcsAllocations(targetWinId).catch(() => []),
        ]);
        setOfferings(offList);
        setApplications(appList);
        setAllocations(allocList);
      } else {
        const offList = await fetchAdminFfcsOfferings().catch(() => []);
        setOfferings(offList);
      }
    } catch (err: unknown) {
      setMessage({ text: "Failed to load FFCS data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRtdb = async () => {
    if (!selectedWindowId) return;
    setSyncingRtdb(true);
    setMessage(null);
    try {
      await syncLiveFfcsState(selectedWindowId);
      setMessage({ text: "Realtime Database live seat availability resynced successfully!", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sync live state";
      setMessage({ text: msg, type: "error" });
    } finally {
      setSyncingRtdb(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWindowId]);

  const handleCreateWindow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winStart || !winEnd) {
      setMessage({ text: "Start and end dates are required", type: "error" });
      return;
    }
    setSubmittingWindow(true);
    setMessage(null);
    try {
      const created = await createFfcsWindow({
        semester: winSem,
        academicYear: winYear,
        startDateTime: winStart,
        endDateTime: winEnd,
        status: winStatus,
      });
      setMessage({ text: "FFCS window created successfully", type: "success" });
      setSelectedWindowId(created.id);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create window";
      setMessage({ text: msg, type: "error" });
    } finally {
      setSubmittingWindow(false);
    }
  };

  const handleToggleWindowStatus = async (id: string, newStatus: "scheduled" | "open" | "closed") => {
    try {
      await updateFfcsWindow(id, { status: newStatus });
      setMessage({ text: `Window status updated to ${newStatus}`, type: "success" });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update window status";
      setMessage({ text: msg, type: "error" });
    }
  };

  const handleCreateOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWindowId) {
      setMessage({ text: "Please select an FFCS window first", type: "error" });
      return;
    }
    if (!offSubjectId || !offTeacherId) {
      setMessage({ text: "Subject and Teacher selection required", type: "error" });
      return;
    }

    const currentWindow = windows.find((w) => w.id === selectedWindowId);
    const selectedCourse = courses.find((c) => (c.id || c._id) === offSubjectId);
    const selectedTeacher = teachers.find((t) => (t.uid || t.id) === offTeacherId);

    setSubmittingOffering(true);
    setMessage(null);

    try {
      await createFfcsOffering({
        windowId: selectedWindowId,
        semester: currentWindow?.semester || "1",
        subjectId: offSubjectId,
        subjectName: selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : "Subject",
        teacherId: offTeacherId,
        teacherName: selectedTeacher?.name || "Teacher",
        day: offDay,
        slotId: offSlotId,
        capacity: Number(offCapacity),
      });

      setMessage({ text: "Course offering published successfully", type: "success" });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create offering";
      setMessage({ text: msg, type: "error" });
    } finally {
      setSubmittingOffering(false);
    }
  };

  const handleToggleOfferingStatus = async (offeringId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateFfcsOffering(offeringId, { status: nextStatus });
      setMessage({ text: `Offering status changed to ${nextStatus}`, type: "success" });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update offering status";
      setMessage({ text: msg, type: "error" });
    }
  };

  const handleRunAllocation = async () => {
    if (!selectedWindowId) return;
    setAllocating(true);
    setMessage(null);
    try {
      const res = await allocateFfcsWindow(selectedWindowId);
      setMessage({
        text: `Allocation complete! Allocated: ${res.summary.totalAllocated}, Waitlisted: ${res.summary.totalWaitlisted}`,
        type: "success",
      });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Allocation failed";
      setMessage({ text: msg, type: "error" });
    } finally {
      setAllocating(false);
    }
  };

  const filteredOfferings = offerings.filter((off) => {
    if (filterSem !== "all" && String(off.semester) !== filterSem) return false;
    if (filterSubject !== "all" && off.subjectId !== filterSubject) return false;
    if (filterTeacher !== "all" && off.teacherId !== filterTeacher) return false;
    return true;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", color: "#1F2937", background: "#FAF8F5", minHeight: "100vh" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#C85A32" }}>
          Campus Hub Portal
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#111827", margin: "4px 0 8px 0" }}>
          FFCS Management
        </h1>
        <p style={{ color: "#6B7280", margin: 0, fontSize: "14px" }}>
          Flexible First Come First Serve Course Selection — Manage selection windows, define teacher offerings, and execute priority seat allocations.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
            fontWeight: 600,
            background: message.type === "success" ? "#F0FDF4" : "#FEF2F2",
            color: message.type === "success" ? "#166534" : "#991B1B",
            border: `1px solid ${message.type === "success" ? "#BBF7D0" : "#FCA5A5"}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E5E0D8", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("windows")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "windows" ? "3px solid #C85A32" : "3px solid transparent",
            color: activeTab === "windows" ? "#C85A32" : "#6B7280",
          }}
        >
          Selection Windows ({windows.length})
        </button>
        <button
          onClick={() => setActiveTab("offerings")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "offerings" ? "3px solid #C85A32" : "3px solid transparent",
            color: activeTab === "offerings" ? "#C85A32" : "#6B7280",
          }}
        >
          Course Offerings ({offerings.length})
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "applications" ? "3px solid #C85A32" : "3px solid transparent",
            color: activeTab === "applications" ? "#C85A32" : "#6B7280",
          }}
        >
          Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab("allocations")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "allocations" ? "3px solid #C85A32" : "3px solid transparent",
            color: activeTab === "allocations" ? "#C85A32" : "#6B7280",
          }}
        >
          Final Allocations ({allocations.length})
        </button>
      </div>

      {activeTab === "windows" && (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "24px" }}>
          <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E5E0D8" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", color: "#111827" }}>
              Create FFCS Window
            </h3>
            <form onSubmit={handleCreateWindow} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Semester</label>
                <select
                  value={winSem}
                  onChange={(e) => setWinSem(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Academic Year</label>
                <input
                  type="text"
                  value={winYear}
                  onChange={(e) => setWinYear(e.target.value)}
                  placeholder="2026-27"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={winStart}
                  onChange={(e) => setWinStart(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>End Date & Time</label>
                <input
                  type="datetime-local"
                  value={winEnd}
                  onChange={(e) => setWinEnd(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Status</label>
                <select
                  value={winStatus}
                  onChange={(e) => setWinStatus(e.target.value as any)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingWindow}
                style={{
                  marginTop: "8px",
                  padding: "10px",
                  borderRadius: "6px",
                  background: "#C85A32",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {submittingWindow ? "Creating..." : "Publish Window"}
              </button>
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#111827" }}>
              Configured Selection Windows
            </h3>
            {windows.length === 0 ? (
              <div style={{ background: "#FFFFFF", padding: "32px", borderRadius: "12px", border: "1px solid #E5E0D8", textAlign: "center", color: "#6B7280" }}>
                No FFCS windows configured yet. Use the panel on the left to create one.
              </div>
            ) : (
              windows.map((win) => (
                <div
                  key={win.id}
                  style={{
                    background: "#FFFFFF",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: selectedWindowId === win.id ? "2px solid #C85A32" : "1px solid #E5E0D8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 800, fontSize: "16px", color: "#111827" }}>
                        Semester {win.semester} ({win.academicYear})
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          textTransform: "uppercase",
                          background: win.status === "open" ? "#DCFCE7" : win.status === "scheduled" ? "#FEF3C7" : "#F3F4F6",
                          color: win.status === "open" ? "#166534" : win.status === "scheduled" ? "#92400E" : "#4B5563",
                        }}
                      >
                        {win.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#6B7280" }}>
                      Start: {new Date(win.startDateTime).toLocaleString()} · End: {new Date(win.endDateTime).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setSelectedWindowId(win.id)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        border: "1px solid #D1D5DB",
                        background: selectedWindowId === win.id ? "#F3F4F6" : "#FFFFFF",
                        cursor: "pointer",
                      }}
                    >
                      {selectedWindowId === win.id ? "Selected" : "Select"}
                    </button>
                    {win.status !== "open" && (
                      <button
                        onClick={() => handleToggleWindowStatus(win.id, "open")}
                        style={{ padding: "6px 12px", fontSize: "13px", fontWeight: 600, borderRadius: "6px", border: "none", background: "#166534", color: "#FFFFFF", cursor: "pointer" }}
                      >
                        Open Window
                      </button>
                    )}
                    {win.status === "open" && (
                      <button
                        onClick={() => handleToggleWindowStatus(win.id, "closed")}
                        style={{ padding: "6px 12px", fontSize: "13px", fontWeight: 600, borderRadius: "6px", border: "none", background: "#991B1B", color: "#FFFFFF", cursor: "pointer" }}
                      >
                        Close Window
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "offerings" && (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px" }}>
          <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E5E0D8" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", color: "#111827" }}>
              Add Course Offering
            </h3>
            <form onSubmit={handleCreateOffering} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Selected Window</label>
                <select
                  value={selectedWindowId}
                  onChange={(e) => setSelectedWindowId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                >
                  <option value="">-- Select Window --</option>
                  {windows.map((w) => (
                    <option key={w.id} value={w.id}>
                      Sem {w.semester} ({w.academicYear}) - {w.status.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Subject</label>
                <select
                  value={offSubjectId}
                  onChange={(e) => setOffSubjectId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                >
                  <option value="">-- Select Subject --</option>
                  {courses.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Teacher</label>
                <select
                  value={offTeacherId}
                  onChange={(e) => setOffTeacherId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.uid || t.id} value={t.uid || t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Day</label>
                <select
                  value={offDay}
                  onChange={(e) => setOffDay(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Timetable Slot</label>
                <select
                  value={offSlotId}
                  onChange={(e) => setOffSlotId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                >
                  {TIMETABLE_SLOTS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Seat Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={offCapacity}
                  onChange={(e) => setOffCapacity(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "14px" }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingOffering}
                style={{
                  marginTop: "8px",
                  padding: "10px",
                  borderRadius: "6px",
                  background: "#C85A32",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {submittingOffering ? "Publishing..." : "Add Offering"}
              </button>
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>Filter Offerings:</span>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px" }}
              >
                <option value="all">All Subjects</option>
                {courses.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.code}</option>
                ))}
              </select>

              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #D1D5DB", fontSize: "13px" }}
              >
                <option value="all">All Teachers</option>
                {teachers.map((t) => (
                  <option key={t.uid || t.id} value={t.uid || t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {filteredOfferings.length === 0 ? (
              <div style={{ background: "#FFFFFF", padding: "32px", borderRadius: "12px", border: "1px solid #E5E0D8", textAlign: "center", color: "#6B7280" }}>
                No FFCS offerings available. Select an active window and add an offering.
              </div>
            ) : (
              <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E0D8", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#F3F4F6", textAlign: "left", borderBottom: "1px solid #E5E0D8" }}>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Subject</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Teacher</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Slot</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Seats (Filled / Total)</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Status</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOfferings.map((off) => {
                      const isFull = off.seatsFilled >= off.capacity;
                      return (
                        <tr key={off.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "12px 16px", fontWeight: 600 }}>{off.subjectName}</td>
                          <td style={{ padding: "12px 16px" }}>{off.teacherName}</td>
                          <td style={{ padding: "12px 16px", color: "#4B5563" }}>
                            {off.day} · {off.startTime}–{off.endTime}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontWeight: 700, color: isFull ? "#991B1B" : "#166534" }}>
                              {off.seatsFilled} / {off.capacity}
                            </span>
                            <span style={{ fontSize: "12px", color: "#6B7280", marginLeft: "6px" }}>
                              ({off.capacity - off.seatsFilled} left)
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "12px",
                                background: isFull ? "#FEE2E2" : off.status === "active" ? "#DCFCE7" : "#F3F4F6",
                                color: isFull ? "#991B1B" : off.status === "active" ? "#166534" : "#4B5563",
                              }}
                            >
                              {isFull ? "FULL" : off.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <button
                              onClick={() => handleToggleOfferingStatus(off.id, off.status)}
                              style={{
                                padding: "4px 10px",
                                fontSize: "12px",
                                fontWeight: 600,
                                borderRadius: "4px",
                                border: "1px solid #D1D5DB",
                                background: "#FFFFFF",
                                cursor: "pointer",
                              }}
                            >
                              {off.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "applications" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E5E0D8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>
                Priority Allocation Engine
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>
                Semester 1: Pure FCFS sorting. Semester 2+: Primary priority CGPA DESC, Secondary priority submission time ASC.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleSyncRtdb}
                disabled={syncingRtdb || !selectedWindowId}
                style={{
                  padding: "10px 16px",
                  borderRadius: "6px",
                  background: "#FFFFFF",
                  color: "#1F2937",
                  fontWeight: 700,
                  border: "1px solid #D1D5DB",
                  cursor: "pointer",
                }}
              >
                {syncingRtdb ? "Syncing RTDB..." : "Resync RTDB Live Seats"}
              </button>
              <button
                onClick={handleRunAllocation}
                disabled={allocating || !selectedWindowId}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  background: "#C85A32",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {allocating ? "Running Engine..." : "Execute Seat Allocation"}
              </button>
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E0D8", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E0D8", fontWeight: 700, fontSize: "15px" }}>
              Student Applications ({applications.length})
            </div>

            {applications.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>
                No student applications submitted for this FFCS window yet.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#F3F4F6", textAlign: "left", borderBottom: "1px solid #E5E0D8" }}>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Student</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Semester</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>CGPA Snapshot</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Submitted At</th>
                    <th style={{ padding: "12px 16px", fontWeight: 700 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>{app.studentName}</td>
                      <td style={{ padding: "12px 16px" }}>Sem {app.semester}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1F2937" }}>
                        {app.cgpaSnapshot !== null ? app.cgpaSnapshot.toFixed(2) : "N/A (Sem 1 FCFS)"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: "13px" }}>
                        {new Date(app.submittedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            textTransform: "capitalize",
                            background: app.status === "allocated" ? "#DCFCE7" : app.status === "pending" ? "#FEF3C7" : "#F3F4F6",
                            color: app.status === "allocated" ? "#166534" : app.status === "pending" ? "#92400E" : "#4B5563",
                          }}
                        >
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === "allocations" && (
        <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E0D8", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E0D8", fontWeight: 700, fontSize: "15px" }}>
            Allocated Course Records ({allocations.length})
          </div>

          {allocations.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>
              No seat allocations confirmed yet for this window.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#F3F4F6", textAlign: "left", borderBottom: "1px solid #E5E0D8" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Student ID</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Offering ID</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Subject ID</th>
                  <th style={{ padding: "12px 16px", fontWeight: 700 }}>Allocated At</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc) => (
                  <tr key={alloc.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{alloc.studentId}</td>
                    <td style={{ padding: "12px 16px" }}>{alloc.offeringId}</td>
                    <td style={{ padding: "12px 16px" }}>{alloc.subjectId}</td>
                    <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: "13px" }}>
                      {new Date(alloc.allocatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
