import { useEffect, useState } from "react";
import {
  fetchLibraryMaterials,
  createLibraryMaterial,
  deleteLibraryMaterial,
  type LibraryMaterial,
} from "../lib/api";

const GENRES = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Literature",
  "History",
  "Engineering",
];

export default function FacultyLibraryPage() {
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<LibraryMaterial["resourceType"]>("Notes");
  const [department, setDepartment] = useState("Computer Science");
  const [course, setCourse] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchLibraryMaterials()
      .then(setMaterials)
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = materials.filter((item) => {
    const matchesGenre = selectedGenre === "All" || item.genre === selectedGenre;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.course.toLowerCase().includes(search.toLowerCase()) ||
      item.uploadedBy.toLowerCase().includes(search.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !genre) {
      setUploadError("Please fill in all required fields and select a file.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadStatus("Saving material to Library...");

    try {
      const newMaterial = await createLibraryMaterial({
        title,
        resourceType,
        department,
        course,
        description,
        genre,
        file,
        uploadedBy: "Faculty",
        uploadedByRole: "faculty",
      });
      setMaterials((prev) => [newMaterial, ...prev]);
      setUploadStatus("Successfully saved & uploaded!");
      setTimeout(() => {
        setShowUpload(false);
        setUploadStatus(null);
        setTitle("");
        setCourse("");
        setDescription("");
        setGenre("");
        setFile(null);
      }, 500);
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!id) return;
    await deleteLibraryMaterial(id);
    setMaterials((prev) => prev.filter((item) => (item._id || item.id) !== id));
  };

  const handleDownload = async (item: LibraryMaterial) => {
    let url = item.fileUrl;
    const itemId = item._id || item.id;
    if (!url || url.startsWith("idb://") || url.includes("unsplash.com")) {
      const { getFileUrlFromIndexedDB } = await import("../lib/idb");
      const idbUrl = await getFileUrlFromIndexedDB(itemId);
      if (idbUrl) url = idbUrl;
    }
    if (!url) {
      alert("File is not available for download.");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = item.fileName || `${item.title.replace(/[^a-zA-Z0-9]/g, "_")}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>📚</span>
            <h2 style={{ margin: 0 }}>Library</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Browse, manage, and upload study materials by genre.
          </p>
        </div>
        <button className="button" onClick={() => setShowUpload((prev) => !prev)}>
          {showUpload ? "Close Upload" : "Upload Material"}
        </button>
      </div>

      {showUpload && (
        <div className="card">
          <h3 style={{ margin: "0 0 12px" }}>Upload New Material</h3>
          <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label className="input">
              Resource Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="input">
                Category
                <select value={resourceType} onChange={(e) => setResourceType(e.target.value as LibraryMaterial["resourceType"])}>
                  <option value="Notes">📘 Lecture Notes</option>
                  <option value="Book">📚 Textbook / E-Book</option>
                  <option value="Question Paper">📝 Question Paper</option>
                  <option value="Image">🖼️ Diagram / Image</option>
                  <option value="Reference">📑 Reference Material</option>
                  <option value="Slides">📊 Presentation Slides</option>
                </select>
              </label>
              <label className="input">
                Genre
                <select value={genre} onChange={(e) => setGenre(e.target.value)} required>
                  <option value="">Select genre</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label className="input">
                Department
                <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics & Comm">Electronics & Comm</option>
                  <option value="Mechanical Eng">Mechanical Eng</option>
                  <option value="General Studies">General Studies</option>
                </select>
              </label>
              <label className="input">
                Course / Subject Code
                <input
                  type="text"
                  placeholder="e.g. CS201 - Data Structures"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                />
              </label>
            </div>
            <label className="input">
              Description
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
              />
            </label>
            <div
              style={{
                margin: "16px 0",
                padding: "20px",
                border: "2px dashed #3b82f6",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                textAlign: "center",
              }}
            >
              <p style={{ fontWeight: 600, color: "#1e40af", marginBottom: "8px" }}>Select File to Upload</p>
              <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>Supports PDF, DOCX, PPTX, PNG, JPG, ZIP (Up to 50MB)</p>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required style={{ fontSize: "14px" }} />
              {file && (
                <div style={{ marginTop: "10px", fontSize: "13px", fontWeight: 600, color: "#047857" }}>
                  Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                </div>
              )}
            </div>
            {uploadStatus && (
              <div className="notice" style={{ background: "#ecfdf5", color: "#065f46", borderColor: "#6ee7b7" }}>
                ✅ {uploadStatus}
              </div>
            )}
            {uploadError && <div className="notice">{uploadError}</div>}
            <button className="button" type="submit" disabled={uploading} style={{ padding: "10px" }}>
              {uploading ? "Uploading..." : "🚀 Upload & Save"}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
          <label className="input" style={{ minWidth: "220px", marginBottom: 0 }}>
            Search materials
            <input
              type="text"
              placeholder="Title, course, or faculty name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--line)", background: "#fff" }}
          >
            <option value="All">All Genres</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
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
            {filtered.map((item) => {
              const itemId = item._id || item.id || "";
              return (
                <div key={itemId} className="card" style={{ textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <span className="badge" style={{ marginBottom: "8px" }}>{item.resourceType}</span>
                      <h3 style={{ margin: "8px 0 6px" }}>{item.title}</h3>
                      {item.genre && <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: "12px" }}>Genre: {item.genre}</p>}
                      <p style={{ margin: "0 0 4px", color: "var(--muted)", fontSize: "12px" }}>{item.course} • {item.department}</p>
                      <p style={{ margin: 0, color: "var(--muted)", fontSize: "12px" }}>👤 {item.uploadedBy}</p>
                    </div>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => handleRemove(itemId)}
                      style={{ marginLeft: "8px", padding: "4px 8px", fontSize: "11px", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    className="button"
                    style={{ marginTop: "10px", width: "100%", textAlign: "center" }}
                  >
                    📥 Open / Download
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && (
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
