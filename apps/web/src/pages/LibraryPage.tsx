import { useEffect, useMemo, useState } from "react";
import { BookOpen, Download, FileText, Filter, Image as ImageIcon, Plus, Search, Trash2, UploadCloud } from "lucide-react";
import { createLibraryMaterial, deleteLibraryMaterial, fetchLibraryMaterials, fetchTeacherClasses, LibraryMaterial, TeacherClass } from "../lib/api";

type Props = {
  userRole?: string;
  userName?: string;
};

export default function LibraryPage({ userRole = "faculty", userName = "Faculty Member" }: Props) {
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("All");
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<"Notes" | "Book" | "Question Paper" | "Image" | "Reference" | "Slides">("Notes");
  const [department, setDepartment] = useState("Computer Science");
  const [course, setCourse] = useState("CS201 - Data Structures");
  const [description, setDescription] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = () => {
      fetchLibraryMaterials()
        .then((data) => {
          if (isMounted) setMaterials(data);
        })
        .catch(() => {
          if (isMounted) setMaterials([]);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    };

    loadData();

    if (userRole === "faculty" || userRole === "teacher" || userRole === "admin") {
      fetchTeacherClasses().then((classes) => {
        if (isMounted) setTeacherClasses(classes);
      }).catch(() => {});
    }

    window.addEventListener("storage", loadData);
    window.addEventListener("focus", loadData);
    const intervalId = setInterval(loadData, 2000);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", loadData);
      window.removeEventListener("focus", loadData);
      clearInterval(intervalId);
    };
  }, []);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this study material?")) return;
    try {
      await deleteLibraryMaterial(id);
      setMaterials((prev) => prev.filter((m) => (m._id || m.id) !== id));
    } catch (err) {
      console.error("Failed to delete material:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Please select a file to upload.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadStatus("Uploading file...");

    try {
      const newMaterial = await createLibraryMaterial({
        title,
        resourceType,
        department,
        course,
        description,
        classId: selectedClassId || undefined,
        file,
        uploadedBy: userName,
        uploadedByRole: userRole,
      });

      setMaterials((prev) => [newMaterial, ...prev]);
      setUploadStatus("Successfully uploaded and saved!");
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadStatus(null);
        setTitle("");
        setDescription("");
        setFile(null);
        setSelectedClassId("");
      }, 1200);
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const title = item?.title || "";
      const course = item?.course || "";
      const uploadedBy = item?.uploadedBy || "";
      const matchesSearch =
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "All" || item.resourceType === selectedType;
      const matchesClass = selectedClassFilter === "All" || item.classId === selectedClassFilter;
      return matchesSearch && matchesType && matchesClass;
    });
  }, [materials, searchQuery, selectedType, selectedClassFilter]);

  const stats = useMemo(() => {
    const notesCount = materials.filter((m) => m.resourceType === "Notes" || m.resourceType === "Slides").length;
    const booksCount = materials.filter((m) => m.resourceType === "Book" || m.resourceType === "Reference").length;
    const papersCount = materials.filter((m) => m.resourceType === "Question Paper").length;
    const imagesCount = materials.filter((m) => m.resourceType === "Image").length;
    return { total: materials.length, notesCount, booksCount, papersCount, imagesCount };
  }, [materials]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Notes":
        return { bg: "#dbeafe", color: "#1e40af" };
      case "Book":
        return { bg: "#fef3c7", color: "#92400e" };
      case "Question Paper":
        return { bg: "#f3e8ff", color: "#6b21a8" };
      case "Image":
        return { bg: "#ecfdf5", color: "#065f46" };
      default:
        return { bg: "#e0e7ff", color: "#3730a3" };
    }
  };

  return (
    <>
      <section className="hero">
        <div>
          <span className="badge">Digital Library & Cloud Drive</span>
          <h2>Academic Study Materials, Lecture Notes & Books</h2>
          <p>
            {userRole === "student"
              ? "Access and download course notes, textbooks, and past papers uploaded by your faculty."
              : "Upload lecture slides, reference books & images directly to Cloudinary with automatic Firestore synchronization for your students."}
          </p>
        </div>
        {(userRole === "faculty" || userRole === "admin") && (
          <button className="button" onClick={() => setShowUploadModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={18} /> Upload New Material
          </button>
        )}
      </section>

      {/* KPI Stats */}
      <section className="grid">
        <div className="card">
          <h3>Total Resources</h3>
          <div className="kpi">{stats.total}</div>
          <p>Files synced with Cloudinary & Firestore.</p>
        </div>
        <div className="card">
          <h3>Lecture Notes & Slides</h3>
          <div className="kpi">{stats.notesCount}</div>
          <p>Study guides and class presentations.</p>
        </div>
        <div className="card">
          <h3>Textbooks & References</h3>
          <div className="kpi">{stats.booksCount}</div>
          <p>Recommended reading materials.</p>
        </div>
        <div className="card">
          <h3>Question Papers & Diagrams</h3>
          <div className="kpi">{stats.papersCount + stats.imagesCount}</div>
          <p>Previous papers & visual aids.</p>
        </div>
      </section>

      {/* Upload Modal for Faculty */}
      {showUploadModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(17, 24, 39, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div className="card fade-in" style={{ maxWidth: "560px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
                ☁️ Upload Material to Cloudinary & Firestore
              </h3>
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                style={{ padding: "4px 10px" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <label className="input">
                Resource Title
                <input
                  type="text"
                  placeholder="e.g. Unit 3 - Graphs & Trees Lecture Notes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label className="input">
                  Resource Category
                  <select value={resourceType} onChange={(e) => setResourceType(e.target.value as any)}>
                    <option value="Notes">📘 Lecture Notes</option>
                    <option value="Book">📚 Textbook / E-Book</option>
                    <option value="Question Paper">📝 Question Paper</option>
                    <option value="Image">🖼️ Diagram / Image</option>
                    <option value="Reference">📑 Reference Material</option>
                    <option value="Slides">📊 Presentation Slides</option>
                  </select>
                </label>

                <label className="input">
                  Department
                  <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & Comm">Electronics & Comm</option>
                    <option value="Mechanical Eng">Mechanical Eng</option>
                    <option value="General Studies">General Studies</option>
                  </select>
                </label>
              </div>

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

              <label className="input">
                Description / Notes for Students
                <textarea
                  rows={3}
                  placeholder="Brief summary of what this document covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                />
              </label>

              {teacherClasses.length > 0 && (
                <label className="input">
                  Assign to Class (optional)
                  <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                    <option value="">🌐 Global — All Students</option>
                    {teacherClasses.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        🏫 {cls.classId} ({cls.studentIds.length} student{cls.studentIds.length !== 1 ? "s" : ""})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {/* File Input */}
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
                <UploadCloud size={36} color="#2563eb" style={{ marginBottom: "8px" }} />
                <p style={{ fontWeight: 600, color: "#1e40af", marginBottom: "4px" }}>
                  Select File to Upload to Cloudinary
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                  Supports PDF, DOCX, PPTX, PNG, JPG, ZIP (Up to 50MB)
                </p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  style={{ fontSize: "14px" }}
                />
                {file && (
                  <div style={{ marginTop: "10px", fontSize: "13px", fontWeight: 600, color: "#047857" }}>
                    Selected: {file.name} ({formatFileSize(file.size)})
                  </div>
                )}
              </div>

              {uploadStatus && (
                <div className="notice" style={{ background: "#ecfdf5", color: "#065f46", borderColor: "#6ee7b7" }}>
                  ✅ {uploadStatus}
                </div>
              )}

              {uploadError && <div className="notice">{uploadError}</div>}

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button className="button" type="submit" disabled={uploading} style={{ flex: 1, padding: "10px" }}>
                  {uploading ? "Uploading to Cloudinary..." : "🚀 Upload & Save to Library"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  style={{ padding: "10px 16px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search & Category Filter Toolbar */}
      <section className="card" style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 300px" }}>
            <Search size={18} color="#6b7280" />
            <input
              type="text"
              placeholder="Search by title, subject code, or faculty name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} color="#6b7280" />
            {["All", "Notes", "Book", "Question Paper", "Image", "Reference"].map((type) => (
              <button
                key={type}
                type="button"
                className={`button ${selectedType === type ? "" : "secondary"}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
            {teacherClasses.length > 0 && (
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                style={{ padding: "4px 10px", fontSize: "12px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}
              >
                <option value="All">All Classes</option>
                {teacherClasses.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>{cls.classId}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {/* Resource Cards Display */}
      <section style={{ marginTop: "20px" }}>
        {loading ? (
          <div className="card" style={{ textAlign: "center", padding: "40px" }}>
            Loading materials...
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px" }}>
            <BookOpen size={48} color="#9ca3af" style={{ marginBottom: "12px" }} />
            <h3>No study materials found</h3>
            <p style={{ color: "#6b7280" }}>
              {searchQuery || selectedType !== "All"
                ? "Try adjusting your search query or filters."
                : "No files have been uploaded yet. Faculty members can upload materials using the button above."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {filteredMaterials.map((item, index) => {
              const badgeStyle = getTypeBadgeColor(item.resourceType);
              const rawFileType =
                item.fileType ||
                (item.fileName && item.fileName.includes(".") ? item.fileName.split(".").pop() : "") ||
                "FILE";
              const fileTypeExt = rawFileType.toUpperCase();
              return (
                <div key={item._id || item.id || index} className="card fade-in" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <span
                        className="badge"
                        style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, margin: 0, fontWeight: 600 }}
                      >
                        {item.resourceType || "Resource"}
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 700, background: "#f3f4f6", padding: "2px 8px", borderRadius: "4px", color: "#4b5563" }}>
                        .{fileTypeExt}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "6px", lineHeight: 1.4 }}>
                      {item.title}
                    </h3>

                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#2563eb", marginBottom: item.classId ? "4px" : "8px" }}>
                      {item.course} • {item.department}
                    </div>

                    {item.classId && (
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, background: "#EEF2FF", color: "#3730A3", padding: "2px 8px", borderRadius: "6px", fontFamily: "monospace" }}>
                          🏫 {item.classId}
                        </span>
                      </div>
                    )}

                    <p style={{ fontSize: "13px", color: "#4b5563", marginBottom: "14px", lineHeight: 1.5 }}>
                      {item.description}
                    </p>
                  </div>

                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "12px", marginTop: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#6b7280", marginBottom: "10px" }}>
                      <span>👤 {item.uploadedBy}</span>
                      <span>📦 {formatFileSize(item.fileSize)}</span>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={item.fileName || item.title || "document"}
                          className="button"
                          style={{
                            flex: 1,
                            textAlign: "center",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            fontSize: "13px",
                            textDecoration: "none",
                          }}
                        >
                          <Download size={14} /> Open / Download File
                        </a>
                      ) : (
                        <button
                          disabled
                          className="button"
                          style={{
                            flex: 1,
                            opacity: 0.6,
                            cursor: "not-allowed",
                            textAlign: "center",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            fontSize: "13px",
                          }}
                          title="File content was missing during initial upload"
                        >
                          <Download size={14} /> File Link Missing
                        </button>
                      )}

                      {(userRole === "faculty" || userRole === "admin") && (
                        <button
                          onClick={() => handleDelete(item._id || item.id)}
                          title="Delete Material"
                          style={{
                            background: "#fee2e2",
                            color: "#991b1b",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 10px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
