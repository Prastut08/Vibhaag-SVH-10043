import { useEffect, useState } from "react";
import {
  fetchTeacherFfcsApplications,
  updateTeacherFfcsApplicationStatus,
  fetchTeacherTimetable,
  fetchClassRoster,
  type TeacherTimetableSlotItem,
  type ClassRosterStudent,
} from "../lib/api";
import { FFCSApplication, TIMETABLE_SLOTS } from "@vibhaag/shared";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FfcsFacultyPage() {
  const [activeTab, setActiveTab] = useState<"timetable" | "requests">("requests");
  const [timetable, setTimetable] = useState<TeacherTimetableSlotItem[]>([]);
  const [applications, setApplications] = useState<(FFCSApplication & { offeringName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Roster modal state
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [rosterData, setRosterData] = useState<{ class: any; students: ClassRosterStudent[] } | null>(null);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      const [ttData, appData] = await Promise.all([
        fetchTeacherTimetable().catch(() => []),
        fetchTeacherFfcsApplications().catch(() => []),
      ]);
      setTimetable(ttData);
      setApplications(appData);
    } catch (err: unknown) {
      setMessage({ text: "Failed to load faculty portal details", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherData();
  }, []);

  const handleUpdateStatus = async (appId: string, status: "allocated" | "rejected") => {
    setProcessingId(appId);
    setMessage(null);
    try {
      const result = await updateTeacherFfcsApplicationStatus(appId, status);
      if (status === "allocated" && result.classId) {
        setMessage({
          text: `✅ Student ACCEPTED! Class ID: ${result.classId} — Enrolled students now share this Class ID.`,
          type: "success",
        });
      } else {
        setMessage({
          text: `Student selection ${status === "allocated" ? "ACCEPTED" : "REJECTED"}.`,
          type: "success",
        });
      }
      loadTeacherData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      setMessage({ text: msg, type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenRoster = async (classId: string) => {
    setSelectedClassId(classId);
    setLoadingRoster(true);
    try {
      const res = await fetchClassRoster(classId);
      setRosterData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load roster";
      setMessage({ text: msg, type: "error" });
    } finally {
      setLoadingRoster(false);
    }
  };

  const allocatedApplications = applications.filter((app) => app.status === "allocated");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "24px", maxWidth: "1200px", margin: "0 auto", color: "#1F2937", background: "#FAF8F5", minHeight: "100vh" }}>
      <div>
        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#C85A32" }}>
          Faculty Portal
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#111827", margin: "4px 0 8px 0" }}>
          FFCS Faculty Approvals & Schedule
        </h1>
        <p style={{ color: "#6B7280", margin: 0, fontSize: "14px" }}>
          Review student course selection requests, accept students into your offerings, and manage your exact teaching schedule.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            background: message.type === "success" ? "#F0FDF4" : "#FEF2F2",
            color: message.type === "success" ? "#166534" : "#991B1B",
            border: `1px solid ${message.type === "success" ? "#BBF7D0" : "#FCA5A5"}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E5E0D8" }}>
        <button
          onClick={() => setActiveTab("requests")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "requests" ? "3px solid #C85A32" : "3px solid transparent",
            color: activeTab === "requests" ? "#C85A32" : "#6B7280",
          }}
        >
          Student Course Requests ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab("timetable")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "timetable" ? "3px solid #C85A32" : "3px solid transparent",
            color: activeTab === "timetable" ? "#C85A32" : "#6B7280",
          }}
        >
          My Teaching Schedule ({timetable.length} Classes)
        </button>
      </div>

      {loading ? (
        <div style={{ background: "#FFFFFF", padding: "40px", borderRadius: "12px", border: "1px solid #E5E0D8", textAlign: "center", color: "#6B7280" }}>
          Loading FFCS faculty portal...
        </div>
      ) : (
        <>
          {activeTab === "requests" && (
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E0D8", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E0D8", fontWeight: 700, fontSize: "15px" }}>
                Student Course Requests ({applications.length})
              </div>

              {applications.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>
                  No student selection requests for your course offerings yet.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#F3F4F6", textAlign: "left", borderBottom: "1px solid #E5E0D8" }}>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Student</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Semester</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Offering / Slot</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Class ID</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Requested At</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Status</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{app.studentName}</td>
                        <td style={{ padding: "12px 16px" }}>Sem {app.semester}</td>
                        <td style={{ padding: "12px 16px" }}>{app.offeringName || app.offeringId}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {(app as any).classId ? (
                            <button
                              onClick={() => handleOpenRoster((app as any).classId)}
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                background: "#FDF8F6",
                                color: "#C85A32",
                                border: "1px solid #E5E0D8",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                fontFamily: "monospace",
                                cursor: "pointer",
                              }}
                              title="Click to view Class Roster"
                            >
                              {(app as any).classId}
                            </button>
                          ) : (
                            <span style={{ color: "#9CA3AF", fontSize: "12px" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: "13px" }}>
                          {new Date(app.submittedAt).toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              textTransform: "capitalize",
                              background: app.status === "allocated" ? "#DCFCE7" : app.status === "pending" ? "#FEF3C7" : "#FEE2E2",
                              color: app.status === "allocated" ? "#166534" : app.status === "pending" ? "#92400E" : "#991B1B",
                            }}
                          >
                            {app.status === "allocated" ? "ACCEPTED" : app.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          {app.status !== "allocated" && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, "allocated")}
                              disabled={processingId === app.id}
                              style={{
                                padding: "6px 14px",
                                fontSize: "12px",
                                fontWeight: 700,
                                borderRadius: "6px",
                                border: "none",
                                background: "#166534",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                marginRight: "8px",
                              }}
                            >
                              {processingId === app.id ? "Accepting..." : "Accept Student"}
                            </button>
                          )}
                          {app.status !== "rejected" && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, "rejected")}
                              disabled={processingId === app.id}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                borderRadius: "6px",
                                border: "1px solid #D1D5DB",
                                background: "#FFFFFF",
                                color: "#991B1B",
                                cursor: "pointer",
                              }}
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "timetable" && (
            <div style={{ background: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E5E0D8" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px 0", color: "#111827" }}>
                My Confirmed Teaching Schedule
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F3F4F6" }}>
                      <th style={{ padding: "10px 14px", border: "1px solid #E5E0D8", textAlign: "left" }}>Slot / Time</th>
                      {DAYS.map((d) => (
                        <th key={d} style={{ padding: "10px 14px", border: "1px solid #E5E0D8", textAlign: "center" }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIMETABLE_SLOTS.map((slot) => (
                      <tr key={slot.id}>
                        <td style={{ padding: "10px 14px", border: "1px solid #E5E0D8", fontWeight: 700, color: "#4B5563" }}>
                          {slot.label}
                        </td>
                        {DAYS.map((day) => {
                          const matchingSlots = timetable.filter(
                            (item) => item.day === day && item.slotId === slot.id
                          );

                          return (
                            <td key={day} style={{ padding: "8px", border: "1px solid #E5E0D8", textAlign: "center", verticalAlign: "top" }}>
                              {matchingSlots.length > 0 ? (
                                matchingSlots.map((item) => (
                                  <div
                                    key={item.timetableId}
                                    style={{
                                      padding: "8px",
                                      borderRadius: "6px",
                                      background: "#FDF8F6",
                                      border: "1px solid #C85A32",
                                      color: "#111827",
                                      fontWeight: 600,
                                      fontSize: "12px",
                                      marginBottom: "4px",
                                      textAlign: "left",
                                    }}
                                  >
                                    <div style={{ fontWeight: 800, color: "#111827" }}>
                                      {item.subjectCode} - {item.subjectName}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                                      {item.startTime}–{item.endTime}
                                    </div>
                                    {item.classId ? (
                                      <button
                                        onClick={() => handleOpenRoster(item.classId!)}
                                        style={{
                                          fontSize: "10px",
                                          fontWeight: 700,
                                          color: "#C85A32",
                                          marginTop: "4px",
                                          background: "none",
                                          border: "none",
                                          padding: 0,
                                          cursor: "pointer",
                                          textDecoration: "underline",
                                        }}
                                      >
                                        Class ID: {item.classId}
                                      </button>
                                    ) : (
                                      <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "2px" }}>
                                        Pending class creation
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Class Roster Modal */}
      {selectedClassId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#FFFFFF", padding: "24px", borderRadius: "12px", width: "90%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E5E0D8", paddingBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#C85A32" }}>
                  Class Roster
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "2px 0 0 0" }}>
                  Class ID: {selectedClassId}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedClassId(null); setRosterData(null); }}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6B7280" }}
              >
                ✕
              </button>
            </div>

            {loadingRoster ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>Loading roster...</div>
            ) : rosterData ? (
              <div>
                <div style={{ fontSize: "13px", color: "#4B5563", marginBottom: "16px" }}>
                  <div><strong>Course:</strong> {rosterData.class.subjectCode || rosterData.class.subjectId} - {rosterData.class.subjectName}</div>
                  <div><strong>Slot:</strong> {rosterData.class.day} ({rosterData.class.startTime}–{rosterData.class.endTime})</div>
                  <div><strong>Total Students:</strong> {rosterData.students.length}</div>
                </div>

                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Enrolled Students ({rosterData.students.length})</h4>
                {rosterData.students.length === 0 ? (
                  <div style={{ color: "#6B7280", fontSize: "13px" }}>No students enrolled in this class.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#F3F4F6", textAlign: "left" }}>
                        <th style={{ padding: "8px 12px", border: "1px solid #E5E0D8" }}>#</th>
                        <th style={{ padding: "8px 12px", border: "1px solid #E5E0D8" }}>Student Name</th>
                        <th style={{ padding: "8px 12px", border: "1px solid #E5E0D8" }}>Enrollment No</th>
                        <th style={{ padding: "8px 12px", border: "1px solid #E5E0D8" }}>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rosterData.students.map((st, idx) => (
                        <tr key={st.id}>
                          <td style={{ padding: "8px 12px", border: "1px solid #E5E0D8" }}>{idx + 1}</td>
                          <td style={{ padding: "8px 12px", border: "1px solid #E5E0D8", fontWeight: 600 }}>{st.name}</td>
                          <td style={{ padding: "8px 12px", border: "1px solid #E5E0D8", fontFamily: "monospace" }}>{st.enrollmentNumber}</td>
                          <td style={{ padding: "8px 12px", border: "1px solid #E5E0D8", color: "#6B7280" }}>{st.email || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div style={{ padding: "16px", color: "#991B1B" }}>Roster details unavailable.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
