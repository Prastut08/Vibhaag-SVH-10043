import { useEffect, useState } from "react";
import { fetchFfcsTimetable, type FfcsSlot } from "../lib/api";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timeSlots = [
  "08:00", "09:00", "09:30", "10:00", "11:00", "11:30",
  "12:00", "14:00", "14:30", "15:00", "16:00", "17:00",
];

export default function FfcsFacultyPage() {
  const [timetable, setTimetable] = useState<FfcsSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<FfcsSlot | null>(null);
  const [flaggedId, setFlaggedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFfcsTimetable()
      .then((data) => {
        setTimetable(data.slots);
      })
      .catch(() => setTimetable([]))
      .finally(() => setLoading(false));
  }, []);

  const mySlots = timetable;

  // Build grid
  const grid: Record<string, Record<string, FfcsSlot[]>> = {};
  for (const day of days) {
    grid[day] = {};
    for (const t of timeSlots) {
      grid[day][t] = [];
    }
  }
  for (const slot of mySlots) {
    if (grid[slot.day] && grid[slot.day][slot.startTime] !== undefined) {
      grid[slot.day][slot.startTime].push(slot);
    }
  }

  const totalHours = mySlots.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    return sum + (eh * 60 + em - (sh * 60 + sm)) / 60;
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>📅</span>
            <h2 style={{ margin: 0 }}>FFCS — My Timetable</h2>
            <span className="badge" style={{ background: "#4f46e5" }}>Faculty</span>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Your assigned sessions for the current FFCS semester. Click a slot to view details or flag conflicts.
          </p>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          ⏳ Loading your timetable…
        </div>
      )}

      {!loading && mySlots.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            📭 No FFCS timetable published yet. Check back after the admin generates and approves it.
          </p>
        </div>
      )}

      {!loading && mySlots.length > 0 && (
        <>
          {/* KPI Row */}
          <div className="grid">
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ margin: 0 }}>Total Sessions</p>
              <div className="kpi" style={{ color: "var(--accent-2)" }}>{mySlots.length}</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ margin: 0 }}>Teaching Hours / Week</p>
              <div className="kpi" style={{ color: "var(--accent-2)" }}>{totalHours.toFixed(1)}h</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ margin: 0 }}>Unique Subjects</p>
              <div className="kpi" style={{ color: "var(--accent-2)" }}>
                {new Set(mySlots.map((s) => s.courseCode)).size}
              </div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ margin: 0 }}>Flagged Conflicts</p>
              <div className="kpi" style={{ color: mySlots.some((s) => s.conflict) ? "#b91c1c" : "var(--accent-2)" }}>
                {mySlots.filter((s) => s.conflict).length}
              </div>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="card" style={{ overflowX: "auto", padding: "16px" }}>
            <h3 style={{ margin: "0 0 16px" }}>📅 My Weekly Schedule</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  <th style={{ background: "#f0eaff", padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: "13px" }}>
                    Time ↓ / Day →
                  </th>
                  {days.map((d) => (
                    <th key={d} style={{ background: "#f0eaff", padding: "10px 14px", textAlign: "center", fontWeight: 700, fontSize: "13px" }}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
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
                              id={`faculty-slot-${slot.id}`}
                              style={{
                                background: slot.id === flaggedId ? "#fef2f2" : slot.type === "lab" ? "#eff6ff" : "#f5f0ff",
                                border: `2px solid ${slot.id === flaggedId ? "#fca5a5" : slot.type === "lab" ? "#93c5fd" : "#a78bfa"}`,
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
                              <div style={{ fontWeight: 700, color: "#1a1a1a" }}>{slot.courseCode}</div>
                              <div style={{ color: "#555" }}>🚪 {slot.room}</div>
                              <div style={{ color: "#777" }}>👥 {slot.batchName}</div>
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

          {/* Sessions List */}
          <div className="card">
            <div className="section-title">
              <h3>📋 Session List</h3>
              <span className="badge" style={{ background: "#4f46e5" }}>{mySlots.length} sessions</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Batch</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mySlots.map((slot) => (
                    <tr key={slot.id}>
                      <td data-label="Course">{slot.courseCode} — {slot.courseName}</td>
                      <td data-label="Day">{slot.day}</td>
                      <td data-label="Time">{slot.startTime}–{slot.endTime}</td>
                      <td data-label="Room">{slot.room}</td>
                      <td data-label="Batch">{slot.batchName}</td>
                      <td data-label="Status">
                        {slot.id === flaggedId ? (
                          <span style={{ color: "#b91c1c", fontWeight: 600 }}>⚠️ Flagged</span>
                        ) : slot.conflict ? (
                          <span style={{ color: "#f59e0b", fontWeight: 600 }}>⚠️ Conflict</span>
                        ) : (
                          <span style={{ color: "var(--accent-2)", fontWeight: 600 }}>✅ OK</span>
                        )}
                      </td>
                      <td data-label="Action">
                        {slot.id !== flaggedId ? (
                          <button
                            className="button secondary"
                            style={{ fontSize: "12px", padding: "4px 10px" }}
                            onClick={() => setFlaggedId(slot.id)}
                            id={`flag-slot-${slot.id}`}
                          >
                            🚩 Flag
                          </button>
                        ) : (
                          <button
                            className="button"
                            style={{ fontSize: "12px", padding: "4px 10px", background: "#6b7280" }}
                            onClick={() => setFlaggedId(null)}
                          >
                            ✕ Unflag
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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
            style={{ maxWidth: "380px", width: "100%", gap: "14px", cursor: "default" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-title">
              <h3 style={{ margin: 0 }}>📋 Session Details</h3>
              <button className="button secondary" onClick={() => setSelectedSlot(null)} style={{ padding: "4px 10px" }}>✕</button>
            </div>
            <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
              <tbody>
                {[
                  ["Course", `${selectedSlot.courseCode} — ${selectedSlot.courseName}`],
                  ["Room", selectedSlot.room],
                  ["Day", selectedSlot.day],
                  ["Time", `${selectedSlot.startTime} – ${selectedSlot.endTime}`],
                  ["Type", selectedSlot.type.toUpperCase()],
                  ["Batch", selectedSlot.batchName],
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
  );
}
