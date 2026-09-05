import { useEffect, useState } from "react";

type AcademicEvent = {
  _id: string;
  title: string;
  date: string;
  description: string;
};

export default function FacultyAcademicEventsPage() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setEvents([
        { _id: "1", title: "Mid-term Examinations", date: "2026-10-15", description: "Mid-term exams for all departments." },
        { _id: "2", title: "Faculty Development Workshop", date: "2026-10-20", description: "Workshop on modern teaching methodologies." },
        { _id: "3", title: "Annual Sports Day", date: "2026-11-05", description: "Inter-department sports competitions." },
        { _id: "4", title: "Research Paper Submission", date: "2026-11-15", description: "Deadline for research paper submissions." },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>🎓</span>
            <h2 style={{ margin: 0 }}>Academic Events</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Stay updated with upcoming academic events and deadlines.
          </p>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          ⏳ Loading events…
        </div>
      )}

      {!loading && (
        <div className="grid">
          {events.map((evt) => (
            <div key={evt._id} className="card">
              <div className="section-title">
                <h3 style={{ margin: 0 }}>{evt.title}</h3>
                <span className="badge" style={{ background: "#4f46e5" }}>{evt.date}</span>
              </div>
              <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>{evt.description}</p>
            </div>
          ))}
          {events.length === 0 && (
            <div className="card" style={{ textAlign: "center", color: "var(--muted)" }}>
              No upcoming events.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
