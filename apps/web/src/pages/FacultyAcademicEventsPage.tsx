import { useEffect, useState } from "react";
import { fetchAcademicEvents, createAcademicEvent, type AcademicEvent } from "../lib/api";

export default function FacultyAcademicEventsPage() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchAcademicEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const newEvent = await createAcademicEvent({ title, date, description });
    setEvents((prev) => [newEvent, ...prev]);
    setTitle("");
    setDate("");
    setDescription("");
    setShowForm(false);
  };

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
        <button className="button" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Close" : "Add Event"}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label className="input">
              Event Title
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label className="input">
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className="input">
              Description
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
              />
            </label>
            <button className="button" type="submit">Save Event</button>
          </form>
        </div>
      )}

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
