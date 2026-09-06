import { useEffect, useState } from "react";
import { fetchAnnouncements, createAnnouncement, deleteAnnouncement, type Announcement } from "../lib/api";

export default function FacultyAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "department" | "batch">("all");
  const [audienceRef, setAudienceRef] = useState("");

  const loadAnnouncements = () => {
    setLoading(true);
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newAnnouncement = await createAnnouncement({
        title,
        body,
        audience,
        audienceRef: audienceRef || undefined,
        authorName: "Faculty Member",
        authorRole: "faculty",
      });
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setTitle("");
      setBody("");
      setAudience("all");
      setAudienceRef("");
      setShowForm(false);
    } catch (err) {
      console.error("Failed to publish announcement:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    setAnnouncements((prev) => prev.filter((a) => (a._id || a.id) !== id));
    await deleteAnnouncement(id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>📢</span>
            <h2 style={{ margin: 0 }}>Faculty Announcements</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Publish and manage broadcast notices for students across departments and batches.
          </p>
        </div>
        <button className="button" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Close Form" : "New Announcement"}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label className="input">
              Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mid-Term Examination Schedule Released"
                required
              />
            </label>
            <label className="input">
              Message / Announcement Content
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write full announcement details here..."
                required
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="input">
                Audience Scope
                <select value={audience} onChange={(e) => setAudience(e.target.value as "all" | "department" | "batch")}>
                  <option value="all">All Students & Staff</option>
                  <option value="department">Specific Department</option>
                  <option value="batch">Specific Batch</option>
                </select>
              </label>
              <label className="input">
                Department / Batch Ref
                <input
                  type="text"
                  placeholder="e.g. CSE or 2024-CSE-A"
                  value={audienceRef}
                  onChange={(e) => setAudienceRef(e.target.value)}
                />
              </label>
            </div>
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Publishing to Firestore…" : "Publish Announcement"}
            </button>
          </form>
        </div>
      )}

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          ⏳ Syncing announcements from database…
        </div>
      )}

      {!loading && (
        <div className="grid">
          {announcements.map((ann) => {
            const idKey = ann._id || ann.id;
            return (
              <div key={idKey} className="card" style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{ann.title}</h3>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" }}>
                      <span className="badge" style={{ background: "#4f46e5" }}>
                        {ann.audience === "all" ? "All Cohorts" : ann.audienceRef || ann.audience}
                      </span>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        By {ann.authorName || "Faculty"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(idKey)}
                    title="Delete announcement"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "18px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    🗑️
                  </button>
                </div>

                <p style={{ margin: "12px 0 0", color: "var(--text-main)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                  {ann.body}
                </p>

                <p style={{ margin: "12px 0 0", color: "var(--muted)", fontSize: "12px" }}>
                  📅 {ann.createdAt ? new Date(ann.createdAt).toLocaleString() : "Just now"}
                </p>
              </div>
            );
          })}
          {announcements.length === 0 && (
            <div className="card" style={{ textAlign: "center", color: "var(--muted)", padding: "40px" }}>
              No active announcements found in database.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
