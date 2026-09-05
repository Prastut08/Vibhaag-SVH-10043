import { useEffect, useMemo, useState } from "react";
import { fetchLibraryMaterials, type LibraryMaterial } from "../lib/api";

type GroupedMaterials = Record<string, LibraryMaterial[]>;

export default function StudentLibraryPage() {
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("All");

  useEffect(() => {
    fetchLibraryMaterials()
      .then(setMaterials)
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = materials.reduce<GroupedMaterials>((acc, item) => {
    const key = item.uploadedBy || "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const faculties = ["All", ...Object.keys(grouped).sort()];

  const filteredEntries = Object.entries(grouped).filter(([faculty]) =>
    selectedFaculty === "All" || faculty === selectedFaculty
  );

  const visibleMaterials = filteredEntries.flatMap(([, list]) => list);

  const searched = useMemo(() => {
    return visibleMaterials.filter(
      (item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.course.toLowerCase().includes(search.toLowerCase()) ||
        item.genre.toLowerCase().includes(search.toLowerCase()) ||
        item.uploadedBy.toLowerCase().includes(search.toLowerCase())
    );
  }, [visibleMaterials, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>📖</span>
            <h2 style={{ margin: 0 }}>Student Library</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Browse study materials uploaded by faculty members.
          </p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
          <label className="input" style={{ minWidth: "220px", marginBottom: 0 }}>
            Search materials
            <input
              type="text"
              placeholder="Title, course, genre, or faculty name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "#fff", minWidth: "180px" }}
          >
            {faculties.map((f) => (
              <option key={f} value={f}>{f === "All" ? "All Faculty" : f}</option>
            ))}
          </select>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
            ⏳ Loading library…
          </div>
        )}

        {!loading && (
          <div className="grid">
            {searched.map((item) => (
              <div key={item._id} className="card" style={{ textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span className="badge" style={{ marginBottom: "8px" }}>{item.resourceType}</span>
                    <h3 style={{ margin: "8px 0 6px" }}>{item.title}</h3>
                    <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: "12px" }}>Genre: {item.genre}</p>
                    <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: "12px" }}>{item.course} • {item.department}</p>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "12px" }}>👤 {item.uploadedBy}</p>
                  </div>
                </div>
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button"
                  style={{ marginTop: "10px", textAlign: "center", textDecoration: "none" }}
                >
                  Open / Download
                </a>
              </div>
            ))}
            {searched.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--muted)" }}>
                No materials found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
