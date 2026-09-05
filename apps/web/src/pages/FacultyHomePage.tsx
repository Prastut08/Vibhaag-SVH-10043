import { useEffect, useState } from "react";

export default function FacultyHomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>🏠</span>
            <h2 style={{ margin: 0 }}>Faculty Hub</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Welcome to your faculty dashboard. Use the sidebar to navigate.
          </p>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          ⏳ Loading...
        </div>
      )}

      <div className="grid">
        <div className="card">
          <h3>Attendance</h3>
          <div className="kpi">--</div>
          <p>View and manage attendance from the sidebar.</p>
        </div>
        <div className="card">
          <h3>Timetable</h3>
          <div className="kpi">--</div>
          <p>View sessions and timetables from the sidebar.</p>
        </div>
        <div className="card">
          <h3>Leave Requests</h3>
          <div className="kpi">--</div>
          <p>Manage student leave requests from the sidebar.</p>
        </div>
        <div className="card">
          <h3>Library</h3>
          <div className="kpi">--</div>
          <p>Upload and manage study materials from the sidebar.</p>
        </div>
      </div>
    </div>
  );
}
