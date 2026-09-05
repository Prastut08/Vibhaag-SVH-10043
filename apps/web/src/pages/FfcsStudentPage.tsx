import { useEffect, useState } from "react";
import { fetchFfcsTimetable, registerFfcsSlot, type FfcsSlot } from "../lib/api";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timeSlots = [
  "08:00", "09:00", "09:30", "10:00", "11:00", "11:30",
  "12:00", "14:00", "14:30", "15:00", "16:00", "17:00",
];

type FilterType = "all" | "lecture" | "lab" | "elective";

export default function FfcsStudentPage() {
  const [allSlots, setAllSlots] = useState<FfcsSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [registering, setRegistering] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [activeTab, setActiveTab] = useState<"browse" | "mytimetable">("mytimetable");
  const [selectedSlot, setSelectedSlot] = useState<FfcsSlot | null>(null);

  useEffect(() => {
    fetchFfcsTimetable()
      .then((data) => {
        setAllSlots(data.slots);
        // Pre-register every 4th slot to demo student's existing registrations
        const preReg = new Set<string>();
        data.slots.forEach((s, i) => { if (i % 4 === 0) preReg.add(s.id); });
        setRegisteredIds(preReg);
      })
      .catch(() => setAllSlots([]))
      .finally(() => setLoading(false));
  }, []);

  const mySlots = allSlots.filter((s) => registeredIds.has(s.id));
  const browseSlots = allSlots.filter((s) => {
    if (filter === "all") return true;
    return s.type === filter || (filter === "elective" && s.isElective);
  });

  const handleRegister = async (slotId: string) => {
    setRegistering(slotId);
    setMessage(null);
    try {
      await registerFfcsSlot(slotId);
      setRegisteredIds((prev) => new Set([...prev, slotId]));
      setMessage("✅ Successfully registered for this slot!");
    } catch {
      setMessage("❌ Registration failed. Please try again.");
    } finally {
      setRegistering(null);
    }
  };

  const handleDrop = (slotId: string) => {
    setRegisteredIds((prev) => {
      const next = new Set(prev);
      next.delete(slotId);
      return next;
    });
    setMessage("🗑️ Slot dropped from your timetable.");
  };

  // Build grid for my timetable
  const grid: Record<string, Record<string, FfcsSlot[]>> = {};
  for (const day of days) {
    grid[day] = {};
    for (const t of timeSlots) grid[day][t] = [];
  }
  for (const slot of mySlots) {
    if (grid[slot.day]?.[slot.startTime] !== undefined) {
      grid[slot.day][slot.startTime].push(slot);
    }
  }

  const totalCredits = mySlots.reduce((sum, s) => sum + (s.credits || 3), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>📅</span>
            <h2 style={{ margin: 0 }}>FFCS — My Schedule</h2>
            <span className="badge" style={{ background: "#2563eb" }}>Student</span>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Fully Flexible Credit System — Browse available slots and build your personalized timetable.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
          <div className="kpi" style={{ color: "var(--accent-2)" }}>{mySlots.length}</div>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>registered slots</p>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)" }}>{totalCredits} credits</div>
        </div>
      </div>

      {message && (
        <div className="notice" style={{ background: message.startsWith("❌") ? "#b91c1c" : "var(--accent-2)" }}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          className={`button ${activeTab === "mytimetable" ? "" : "secondary"}`}
          onClick={() => setActiveTab("mytimetable")}
          id="ffcs-my-timetable-tab"
        >
          📋 My Timetable
        </button>
        <button
          className={`button ${activeTab === "browse" ? "" : "secondary"}`}
          onClick={() => setActiveTab("browse")}
          id="ffcs-browse-tab"
        >
          🔍 Browse Slots
        </button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          ⏳ Loading FFCS timetable…
        </div>
      )}

      {/* ── MY TIMETABLE ── */}
      {!loading && activeTab === "mytimetable" && (
        <>
          {mySlots.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>
                📭 You haven't registered any FFCS slots yet.
              </p>
              <button className="button" onClick={() => setActiveTab("browse")} id="ffcs-browse-cta">
                🔍 Browse Available Slots
              </button>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid">
                <div className="card" style={{ textAlign: "center" }}>
                  <p style={{ margin: 0 }}>Registered Slots</p>
                  <div className="kpi" style={{ color: "var(--accent-2)" }}>{mySlots.length}</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                  <p style={{ margin: 0 }}>Total Credits</p>
                  <div className="kpi" style={{ color: "var(--accent-2)" }}>{totalCredits}</div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                  <p style={{ margin: 0 }}>Unique Subjects</p>
                  <div className="kpi" style={{ color: "var(--accent-2)" }}>
                    {new Set(mySlots.map((s) => s.courseCode)).size}
                  </div>
                </div>
                <div className="card" style={{ textAlign: "center" }}>
                  <p style={{ margin: 0 }}>Days with Classes</p>
                  <div className="kpi" style={{ color: "var(--accent-2)" }}>
                    {new Set(mySlots.map((s) => s.day)).size}
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="card" style={{ overflowX: "auto", padding: "16px" }}>
                <h3 style={{ margin: "0 0 16px" }}>📅 My Weekly FFCS Timetable</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                  <thead>
                    <tr>
                      <th style={{ background: "#dbeafe", padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: "13px" }}>
                        Time ↓ / Day →
                      </th>
                      {days.map((d) => (
                        <th key={d} style={{ background: "#dbeafe", padding: "10px 14px", textAlign: "center", fontWeight: 700, fontSize: "13px" }}>
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
                                  id={`student-slot-${slot.id}`}
                                  style={{
                                    background: slot.type === "lab" ? "#eff6ff" : "#ecfdf5",
                                    border: `2px solid ${slot.type === "lab" ? "#93c5fd" : "#6ee7b7"}`,
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
                                  <div style={{ color: "#555" }}>{slot.facultyName.split(" ").slice(-1)[0]}</div>
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

              {/* Registered list */}
              <div className="card">
                <div className="section-title">
                  <h3>📋 Registered Courses</h3>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Faculty</th>
                        <th>Day &amp; Time</th>
                        <th>Room</th>
                        <th>Credits</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySlots.map((slot) => (
                        <tr key={slot.id}>
                          <td data-label="Course">{slot.courseCode} — {slot.courseName}</td>
                          <td data-label="Faculty">{slot.facultyName}</td>
                          <td data-label="Day & Time">{slot.day} {slot.startTime}–{slot.endTime}</td>
                          <td data-label="Room">{slot.room}</td>
                          <td data-label="Credits">{slot.credits || 3}</td>
                          <td data-label="Action">
                            <button
                              className="button secondary"
                              style={{ fontSize: "12px", padding: "4px 10px" }}
                              onClick={() => handleDrop(slot.id)}
                              id={`drop-slot-${slot.id}`}
                            >
                              🗑️ Drop
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── BROWSE SLOTS ── */}
      {!loading && activeTab === "browse" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Filter Bar */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--muted)" }}>Filter:</span>
            {(["all", "lecture", "lab", "elective"] as FilterType[]).map((f) => (
              <button
                key={f}
                className={`button ${filter === f ? "" : "secondary"}`}
                style={{ fontSize: "13px", padding: "6px 12px" }}
                onClick={() => setFilter(f)}
                id={`ffcs-filter-${f}`}
              >
                {f === "all" ? "📚 All" : f === "lecture" ? "🎓 Lectures" : f === "lab" ? "🔬 Labs" : "⭐ Electives"}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: "13px", color: "var(--muted)" }}>
              {browseSlots.length} slots available
            </span>
          </div>

          {browseSlots.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              No slots match this filter. The admin may not have published the timetable yet.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Faculty</th>
                    <th>Day &amp; Time</th>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Credits</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {browseSlots.map((slot) => {
                    const isRegistered = registeredIds.has(slot.id);
                    return (
                      <tr key={slot.id} style={{ opacity: isRegistered ? 0.7 : 1 }}>
                        <td data-label="Course">
                          <div style={{ fontWeight: 600 }}>{slot.courseCode}</div>
                          <div style={{ fontSize: "12px", color: "var(--muted)" }}>{slot.courseName}</div>
                        </td>
                        <td data-label="Faculty">{slot.facultyName}</td>
                        <td data-label="Day & Time">{slot.day} {slot.startTime}–{slot.endTime}</td>
                        <td data-label="Room">{slot.room}</td>
                        <td data-label="Type">
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: slot.type === "lab" ? "#dbeafe" : slot.isElective ? "#fef3c7" : "#dcfce7",
                            color: slot.type === "lab" ? "#1d4ed8" : slot.isElective ? "#d97706" : "#166534",
                          }}>
                            {slot.type === "lab" ? "🔬 Lab" : slot.isElective ? "⭐ Elective" : "🎓 Lecture"}
                          </span>
                        </td>
                        <td data-label="Credits">{slot.credits || 3}</td>
                        <td data-label="Action">
                          {isRegistered ? (
                            <span style={{ color: "var(--accent-2)", fontWeight: 600, fontSize: "13px" }}>✅ Registered</span>
                          ) : (
                            <button
                              className="button"
                              style={{ fontSize: "12px", padding: "5px 12px" }}
                              onClick={() => handleRegister(slot.id)}
                              disabled={registering === slot.id}
                              id={`register-slot-${slot.id}`}
                            >
                              {registering === slot.id ? "…" : "➕ Register"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
                  ["Credits", String(selectedSlot.credits || 3)],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px", fontWeight: 600, color: "var(--muted)", width: "80px" }}>{k}</td>
                    <td style={{ padding: "8px" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!registeredIds.has(selectedSlot.id) && (
              <button
                className="button"
                style={{ width: "100%" }}
                onClick={() => { handleRegister(selectedSlot.id); setSelectedSlot(null); }}
                id={`modal-register-${selectedSlot.id}`}
              >
                ➕ Register for this Slot
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
