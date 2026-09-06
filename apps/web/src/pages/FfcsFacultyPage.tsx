import { useEffect, useState } from "react";
import { fetchFfcsTimetable, fetchTeacherFfcsApplications, updateTeacherFfcsApplicationStatus, type FfcsSlot } from "../lib/api";
import { FFCSApplication, TIMETABLE_SLOTS } from "@vibhaag/shared";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timeSlots = [
  "08:00", "09:00", "09:30", "10:00", "11:00", "11:30",
  "12:00", "14:00", "14:30", "15:00", "16:00", "17:00",
];

export default function FfcsFacultyPage() {
  const [activeTab, setActiveTab] = useState<"timetable" | "requests">("requests");
  const [timetable, setTimetable] = useState<FfcsSlot[]>([]);
  const [applications, setApplications] = useState<(FFCSApplication & { offeringName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<FfcsSlot | null>(null);
  const [flaggedId, setFlaggedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const myName = "Dr. Ananya Roy";

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      const [ttData, appData] = await Promise.all([
        fetchFfcsTimetable().catch(() => ({ slots: [] })),
        fetchTeacherFfcsApplications().catch(() => []),
      ]);
      setTimetable(ttData.slots || []);
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
          text: `✅ Student ACCEPTED! Class ID generated: ${result.classId} — Students in this offering share this Class ID. Upload library materials to this class from the Library page.`,
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

  const allocatedApplications = applications.filter((app) => app.status === "allocated");

  const grid: Record<string, Record<string, typeof allocatedApplications>> = {};
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]) {
    grid[day] = {};
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "24px", maxWidth: "1200px", margin: "0 auto", color: "#1F2937", background: "#FAF8F5", minHeight: "100vh" }}>
      <div>
        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#C85A32" }}>
          Faculty Portal
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#111827", margin: "4px 0 8px 0" }}>
          FFCS Faculty Approvals
        </h1>
        <p style={{ color: "#6B7280", margin: 0, fontSize: "14px" }}>
          Review student course selection requests, accept students into your offerings, and automatically populate their confirmed timetable.
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
          My Teaching Schedule ({allocatedApplications.length})
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
                            <span style={{ fontSize: "11px", fontWeight: 700, background: "#EEF2FF", color: "#3730A3", padding: "2px 8px", borderRadius: "6px", fontFamily: "monospace" }}>
                              {(app as any).classId}
                            </span>
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
              {allocatedApplications.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>
                  No registered student course slots confirmed yet. Accept student requests to populate your schedule.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#F3F4F6" }}>
                        <th style={{ padding: "10px 14px", border: "1px solid #E5E0D8", textAlign: "left" }}>Slot / Time</th>
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
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
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
                            const matchingApps = allocatedApplications.filter((app) => {
                              return app.offeringName?.includes(day);
                            });

                            return (
                              <td key={day} style={{ padding: "8px", border: "1px solid #E5E0D8", textAlign: "center", verticalAlign: "top" }}>
                                {matchingApps.length > 0 ? (
                                  <div
                                    key={matchingApps[0].id}
                                    style={{
                                      padding: "6px 8px",
                                      borderRadius: "6px",
                                      background: "#FDF8F6",
                                      border: "1px solid #C85A32",
                                      color: "#111827",
                                      fontWeight: 600,
                                      fontSize: "12px",
                                    }}
                                  >
                                    <div style={{ fontWeight: 700 }}>{matchingApps[0].offeringName?.split("(")[0]?.trim() || "Assigned Class"}</div>
                                    <div style={{ fontSize: "11px", color: "#4B5563", marginTop: "2px" }}>
                                      {matchingApps.length} Student{matchingApps.length > 1 ? "s" : ""} Enrolled
                                    </div>
                                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#166534", marginTop: "2px" }}>
                                      CONFIRMED CLASS
                                    </div>
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
