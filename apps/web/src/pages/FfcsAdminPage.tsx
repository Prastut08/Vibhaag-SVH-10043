import { useEffect, useState } from "react";
import {
  fetchFfcsConfig,
  saveFfcsConfig,
  generateFfcsTimetable,
  fetchFfcsTimetable,
  approveFfcsTimetable,
  fetchDepartments,
  fetchBatches,
  fetchCourses,
  fetchUsers,
  type FfcsConfig,
  type FfcsSlot,
} from "../lib/api";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timeSlots = [
  "08:00", "09:00", "09:30", "10:00", "11:00", "11:30",
  "12:00", "14:00", "14:30", "15:00", "16:00", "17:00",
];

type View = "config" | "timetable";

export default function FfcsAdminPage() {
  const [view, setView] = useState<View>("config");

  // Config state
  const [semester, setSemester] = useState("Odd 2026-27");
  const [classrooms, setClassrooms] = useState("12");
  const [labs, setLabs] = useState("4");
  const [maxClassesPerDay, setMaxClassesPerDay] = useState("6");
  const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([]);
  const [batches, setBatches] = useState<{ _id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ _id: string; name: string; code: string }[]>([]);
  const [faculty, setFaculty] = useState<{ _id: string; name: string }[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [avgLeavePerMonth, setAvgLeavePerMonth] = useState("2");
  const [specialSlots, setSpecialSlots] = useState("Assembly: Mon 08:00-09:00\nLibrary: Thu 14:00-15:00");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);

  // Timetable state
  const [timetable, setTimetable] = useState<FfcsSlot[]>([]);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<FfcsSlot | null>(null);

  useEffect(() => {
    fetchDepartments().then(setDepartments).catch(() => {});
    fetchBatches().then(setBatches).catch(() => {});
    fetchCourses().then(setCourses).catch(() => {});
    fetchUsers().then((u) => setFaculty(u.filter((x) => x.role === "faculty").map((x) => ({ _id: (x as any)._id || "", name: (x as any).name || "" })))).catch(() => {});
    fetchFfcsTimetable().then((data) => {
      if (data.slots.length > 0) {
        setTimetable(data.slots);
        setApproved(data.status === "approved");
      }
    }).catch(() => {});
  }, []);

  const toggleCourse = (id: string) => {
    setSelectedCourses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const config: FfcsConfig = {
        semester,
        classrooms: Number(classrooms),
        labs: Number(labs),
        maxClassesPerDay: Number(maxClassesPerDay),
        avgLeavePerMonth: Number(avgLeavePerMonth),
        courseIds: selectedCourses.length > 0 ? selectedCourses : courses.map((c) => c._id),
        specialSlots: specialSlots.trim(),
      };
      const saved = await saveFfcsConfig(config);
      setConfigId(saved.id);
      setMessage("✅ Configuration saved successfully.");
    } catch {
      setMessage("❌ Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const config: FfcsConfig = {
        semester,
        classrooms: Number(classrooms),
        labs: Number(labs),
        maxClassesPerDay: Number(maxClassesPerDay),
        avgLeavePerMonth: Number(avgLeavePerMonth),
        courseIds: selectedCourses.length > 0 ? selectedCourses : courses.map((c) => c._id),
        specialSlots: specialSlots.trim(),
      };
      const saved = await saveFfcsConfig(config);
      setConfigId(saved.id);
      const slots = await generateFfcsTimetable(saved.id);
      setTimetable(slots);
      setApproved(false);
      setView("timetable");
      setMessage("✅ Timetable generated! Review and approve below.");
    } catch {
      setMessage("❌ Generation failed. Please check parameters.");
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!configId) return;
    setApproving(true);
    try {
      await approveFfcsTimetable(configId);
      setApproved(true);
      setMessage("✅ Timetable approved and published.");
    } catch {
      setMessage("❌ Approval failed.");
    } finally {
      setApproving(false);
    }
  };

  // Build grid: days × timeSlots
  const grid: Record<string, Record<string, FfcsSlot[]>> = {};
  for (const day of days) {
    grid[day] = {};
    for (const t of timeSlots) {
      grid[day][t] = [];
    }
  }
  for (const slot of timetable) {
    if (grid[slot.day] && grid[slot.day][slot.startTime] !== undefined) {
      grid[slot.day][slot.startTime].push(slot);
    }
  }

  // Compute stats
  const totalSlots = timetable.length;
  const utilizedRooms = new Set(timetable.map((s) => s.room)).size;
  const totalFaculty = new Set(timetable.map((s) => s.facultyName)).size;
  const conflicts = timetable.filter((s) => s.conflict).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>📅</span>
            <h2 style={{ margin: 0 }}>FFCS — Timetable Management</h2>
            <span className="badge">Admin</span>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Fully Flexible Credit System — Configure parameters, generate optimized timetables, review &amp; approve.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={`button ${view === "config" ? "" : "secondary"}`}
            onClick={() => setView("config")}
            id="ffcs-config-tab"
          >
            ⚙️ Configure
          </button>
          <button
            className={`button ${view === "timetable" ? "" : "secondary"}`}
            onClick={() => setView("timetable")}
            disabled={timetable.length === 0}
            id="ffcs-timetable-tab"
          >
            📋 Timetable {timetable.length > 0 && `(${totalSlots})`}
          </button>
        </div>
      </div>

      {message && (
        <div className="notice" style={{ background: message.startsWith("❌") ? "#b91c1c" : "var(--accent-2)" }}>
          {message}
        </div>
      )}

      {/* ── CONFIG VIEW ── */}
      {view === "config" && (
        <div style={{ display: "grid", gap: "20px" }}>

          {/* Semester & Infrastructure */}
          <div className="card">
            <div className="section-title">
              <h3>🏫 Semester &amp; Infrastructure</h3>
            </div>
            <div className="form-grid">
              <label className="input">
                Semester
                <input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="Odd 2026-27" />
              </label>
              <label className="input">
                Classrooms Available
                <input type="number" min="1" value={classrooms} onChange={(e) => setClassrooms(e.target.value)} />
              </label>
              <label className="input">
                Labs Available
                <input type="number" min="0" value={labs} onChange={(e) => setLabs(e.target.value)} />
              </label>
              <label className="input">
                Max Classes / Day
                <input type="number" min="1" max="10" value={maxClassesPerDay} onChange={(e) => setMaxClassesPerDay(e.target.value)} />
              </label>
              <label className="input">
                Avg Faculty Leaves / Month
                <input type="number" min="0" max="30" value={avgLeavePerMonth} onChange={(e) => setAvgLeavePerMonth(e.target.value)} />
              </label>
            </div>
          </div>

          {/* Subjects */}
          <div className="card">
            <div className="section-title">
              <h3>📚 Subjects for this Semester</h3>
              <span className="badge" style={{ background: "var(--accent-2)" }}>
                {selectedCourses.length > 0 ? selectedCourses.length : courses.length} selected
              </span>
            </div>
            <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: "13px" }}>
              Select subjects to include. Unselected = all subjects included.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {courses.map((course) => {
                const active = selectedCourses.length === 0 || selectedCourses.includes(course._id);
                return (
                  <button
                    key={course._id}
                    className={`button ${active ? "" : "secondary"}`}
                    style={{ fontSize: "13px", padding: "6px 12px" }}
                    onClick={() => toggleCourse(course._id)}
                    id={`ffcs-course-${course._id}`}
                  >
                    {course.code} · {course.name}
                  </button>
                );
              })}
              {courses.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>Loading subjects…</p>
              )}
            </div>
          </div>

          {/* Batches */}
          <div className="card">
            <div className="section-title">
              <h3>👥 Student Batches</h3>
              <span className="badge" style={{ background: "var(--accent-2)" }}>{batches.length} batches</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {batches.map((b) => (
                <span
                  key={b._id}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: "#f4e9dc",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {b.name}
                </span>
              ))}
            </div>
          </div>

          {/* Faculty */}
          <div className="card">
            <div className="section-title">
              <h3>👨‍🏫 Faculty Pool</h3>
              <span className="badge" style={{ background: "var(--accent-2)" }}>{faculty.length} available</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Max Slots / Week</th>
                    <th>Avg Leaves / Month</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.map((f, i) => (
                    <tr key={f._id}>
                      <td data-label="Name">{f.name}</td>
                      <td data-label="Max Slots">{16 - (i % 4) * 2}</td>
                      <td data-label="Avg Leaves">{avgLeavePerMonth}</td>
                    </tr>
                  ))}
                  {faculty.length === 0 && (
                    <tr><td colSpan={3} style={{ color: "var(--muted)", textAlign: "center" }}>No faculty loaded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Special / Fixed Slots */}
          <div className="card">
            <div className="section-title">
              <h3>📌 Fixed / Special Slots</h3>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "var(--muted)" }}>
              One per line: Label: Day HH:MM-HH:MM
            </p>
            <label className="input">
              <textarea
                value={specialSlots}
                onChange={(e) => setSpecialSlots(e.target.value)}
                style={{ minHeight: "80px" }}
                placeholder={"Assembly: Mon 08:00-09:00\nLibrary: Thu 14:00-15:00"}
              />
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button className="button secondary" onClick={handleSaveConfig} disabled={saving} id="ffcs-save-config">
              {saving ? "Saving…" : "💾 Save Configuration"}
            </button>
            <button className="button" onClick={handleGenerate} disabled={generating} id="ffcs-generate-btn" style={{ fontSize: "15px", padding: "12px 24px" }}>
              {generating ? "⏳ Generating optimized timetable…" : "⚡ Generate FFCS Timetable"}
            </button>
          </div>
        </div>
      )}

      {/* ── TIMETABLE VIEW ── */}
      {view === "timetable" && timetable.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* KPI Row */}
          <div className="grid">
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ margin: 0 }}>Total Slots</p>
              <div className="kpi" style={{ color: "var(--accent-2)" }}>{totalSlots}</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ margin: 0 }}>Rooms Utilized</p>
              <div className="kpi" style={{ color: "var(--accent-2)" }}>{utilizedRooms}</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ margin: 0 }}>Faculty Assigned</p>
              <div className="kpi" style={{ color: "var(--accent-2)" }}>{totalFaculty}</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ margin: 0 }}>Conflicts Detected</p>
              <div className="kpi" style={{ color: conflicts > 0 ? "#b91c1c" : "var(--accent-2)" }}>{conflicts}</div>
            </div>
          </div>

          {/* Approval */}
          <div className="card" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ margin: "0 0 4px" }}>
                Status:{" "}
                <span style={{ color: approved ? "var(--accent-2)" : "var(--accent)", fontWeight: 700 }}>
                  {approved ? "✅ Approved & Published" : "⏳ Pending Approval"}
                </span>
              </h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "13px" }}>
                {approved
                  ? "This timetable is live and visible to faculty and students."
                  : "Review the generated timetable below, then approve to publish."}
              </p>
            </div>
            {!approved && (
              <button className="button" onClick={handleApprove} disabled={approving} id="ffcs-approve-btn" style={{ padding: "12px 24px" }}>
                {approving ? "Publishing…" : "✅ Approve & Publish"}
              </button>
            )}
          </div>

          {/* Grid */}
          <div className="card" style={{ overflowX: "auto", padding: "16px" }}>
            <h3 style={{ margin: "0 0 16px" }}>📅 Weekly Timetable Grid</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  <th style={{ background: "#f4e9dc", padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: "13px", borderRadius: "8px 0 0 0" }}>
                    Time ↓ / Day →
                  </th>
                  {days.map((d) => (
                    <th key={d} style={{ background: "#f4e9dc", padding: "10px 14px", textAlign: "center", fontWeight: 700, fontSize: "13px" }}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time, ti) => (
                  <tr key={time} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px 14px", fontWeight: 600, fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {time}
                    </td>
                    {days.map((day) => {
                      const slots = grid[day][time] || [];
                      return (
                        <td key={day} style={{ padding: "4px 6px", verticalAlign: "top", minWidth: "120px" }}>
                          {slots.map((slot) => (
                            <div
                              key={slot.id}
                              onClick={() => setSelectedSlot(slot)}
                              id={`ffcs-slot-${slot.id}`}
                              style={{
                                background: slot.conflict
                                  ? "#fef2f2"
                                  : slot.type === "lab"
                                  ? "#eff6ff"
                                  : "#f0fdf4",
                                border: `1px solid ${slot.conflict ? "#fca5a5" : slot.type === "lab" ? "#93c5fd" : "#86efac"}`,
                                borderRadius: "8px",
                                padding: "6px 8px",
                                fontSize: "11px",
                                cursor: "pointer",
                                marginBottom: "4px",
                                transition: "transform 0.15s",
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                            >
                              <div style={{ fontWeight: 700, marginBottom: "2px", color: "#1a1a1a" }}>
                                {slot.conflict ? "⚠️ " : ""}{slot.courseCode}
                              </div>
                              <div style={{ color: "#555" }}>{slot.facultyName}</div>
                              <div style={{ color: "#777" }}>🚪 {slot.room}</div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Slot detail modal */}
          {selectedSlot && (
            <div
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
              }}
              onClick={() => setSelectedSlot(null)}
            >
              <div
                className="card"
                style={{ maxWidth: "400px", width: "100%", gap: "14px", cursor: "default" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="section-title">
                  <h3 style={{ margin: 0 }}>📋 Slot Details</h3>
                  <button className="button secondary" onClick={() => setSelectedSlot(null)} style={{ padding: "4px 10px" }}>✕</button>
                </div>
                <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
                  <tbody>
                    {[
                      ["Course", `${selectedSlot.courseCode} — ${selectedSlot.courseName}`],
                      ["Faculty", selectedSlot.facultyName],
                      ["Room", selectedSlot.room],
                      ["Day", selectedSlot.day],
                      ["Time", `${selectedSlot.startTime} – ${selectedSlot.endTime}`],
                      ["Type", selectedSlot.type.toUpperCase()],
                      ["Batch", selectedSlot.batchName],
                      ["Conflict", selectedSlot.conflict ? "⚠️ Yes — " + selectedSlot.conflictReason : "✅ None"],
                    ].map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "8px", fontWeight: 600, color: "var(--muted)", width: "100px" }}>{k}</td>
                        <td style={{ padding: "8px" }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
