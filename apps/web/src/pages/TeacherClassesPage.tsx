import { useEffect, useState } from "react";
import { fetchTeacherClasses, fetchClassRoster, type TeacherClass, type ClassRosterStudent } from "../lib/api";
import { Users, School, Clock, Calendar, BookOpen } from "lucide-react";

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [roster, setRoster] = useState<ClassRosterStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeacherClasses();
      setClasses(data);
      if (data.length > 0) {
        handleSelectClass(data[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load classes";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleSelectClass = async (cls: TeacherClass) => {
    setSelectedClass(cls);
    setLoadingRoster(true);
    try {
      const res = await fetchClassRoster(cls.classId);
      setRoster(res.students || []);
    } catch (err: unknown) {
      setRoster([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "24px", maxWidth: "1200px", margin: "0 auto", color: "#1F2937", background: "#FAF8F5", minHeight: "100vh" }}>
      <div>
        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#C85A32" }}>
          Faculty Portal
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#111827", margin: "4px 0 8px 0" }}>
          My Assigned Classes
        </h1>
        <p style={{ color: "#6B7280", margin: 0, fontSize: "14px" }}>
          Manage your course offerings, view Class IDs, and inspect real-time student rosters.
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#FEF2F2", color: "#991B1B", border: "1px solid #FCA5A5", fontSize: "14px", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ background: "#FFFFFF", padding: "40px", borderRadius: "12px", border: "1px solid #E5E0D8", textAlign: "center", color: "#6B7280" }}>
          Loading assigned classes...
        </div>
      ) : classes.length === 0 ? (
        <div style={{ background: "#FFFFFF", padding: "40px", borderRadius: "12px", border: "1px solid #E5E0D8", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📚</div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: "0 0 8px 0" }}>
            No Assigned Classes Found
          </h3>
          <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>
            You have not accepted any student course selections yet. Accept students from the FFCS portal to automatically create your classes.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px" }}>
          {/* Class List Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: 0 }}>
              Class Offerings ({classes.length})
            </h3>
            {classes.map((cls) => {
              const isSelected = selectedClass?.classId === cls.classId;
              const studentCount = cls.studentIds?.length || cls.studentCount || 0;
              return (
                <div
                  key={cls.id || cls.classId}
                  onClick={() => handleSelectClass(cls)}
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    border: `2px solid ${isSelected ? "#C85A32" : "#E5E0D8"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 2px 8px rgba(200, 90, 50, 0.15)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 800, background: "#FDF8F6", color: "#C85A32", padding: "2px 8px", borderRadius: "6px", fontFamily: "monospace" }}>
                        {cls.classId}
                      </span>
                      <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#111827", margin: "6px 0 2px 0" }}>
                        {cls.subjectCode || cls.subjectId} - {cls.subjectName}
                      </h4>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534", background: "#DCFCE7", padding: "2px 8px", borderRadius: "12px" }}>
                      Active
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#6B7280", marginTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={13} color="#C85A32" />
                      <span>{cls.day || "Scheduled"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={13} color="#C85A32" />
                      <span>{cls.startTime && cls.endTime ? `${cls.startTime}–${cls.endTime}` : (cls.slotId || "Slot")}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "auto", fontWeight: 700, color: "#111827" }}>
                      <Users size={13} color="#C85A32" />
                      <span>{studentCount} Students</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Roster & Details Column */}
          {selectedClass && (
            <div style={{ background: "#FFFFFF", padding: "24px", borderRadius: "12px", border: "1px solid #E5E0D8" }}>
              <div style={{ borderBottom: "1px solid #E5E0D8", paddingBottom: "16px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 800, color: "#C85A32" }}>
                    Enrolled Roster
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 800, background: "#FDF8F6", color: "#C85A32", padding: "4px 10px", borderRadius: "6px", fontFamily: "monospace" }}>
                    Class ID: {selectedClass.classId}
                  </span>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#111827", margin: "6px 0 4px 0" }}>
                  {selectedClass.subjectCode || selectedClass.subjectId} — {selectedClass.subjectName}
                </h2>
                <div style={{ fontSize: "13px", color: "#4B5563", display: "flex", gap: "16px", marginTop: "6px" }}>
                  <span>📅 {selectedClass.day}</span>
                  <span>⏰ {selectedClass.startTime}–{selectedClass.endTime} ({selectedClass.slotId})</span>
                  <span>👥 {roster.length} Enrolled</span>
                </div>
              </div>

              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>
                Student Roster ({roster.length})
              </h4>

              {loadingRoster ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>
                  Loading class roster...
                </div>
              ) : roster.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#6B7280", background: "#FAF8F5", borderRadius: "8px" }}>
                  No students currently enrolled in this class.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F3F4F6", textAlign: "left", borderBottom: "1px solid #E5E0D8" }}>
                      <th style={{ padding: "10px 12px", fontWeight: 700 }}>#</th>
                      <th style={{ padding: "10px 12px", fontWeight: 700 }}>Student Name</th>
                      <th style={{ padding: "10px 12px", fontWeight: 700 }}>Enrollment No</th>
                      <th style={{ padding: "10px 12px", fontWeight: 700 }}>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((student, index) => (
                      <tr key={student.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "10px 12px", color: "#6B7280" }}>{index + 1}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#111827" }}>{student.name}</td>
                        <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#C85A32", fontWeight: 700 }}>{student.enrollmentNumber}</td>
                        <td style={{ padding: "10px 12px", color: "#6B7280" }}>{student.email || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
