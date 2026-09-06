import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../lib/firebase";
import {
  fetchStudentFfcsStatus,
  fetchStudentFfcsOfferings,
  fetchStudentFfcsApplications,
  submitStudentFfcsApplication,
} from "../lib/api";
import { FFCSWindow, FFCSOffering, FFCSApplication, TIMETABLE_SLOTS } from "@vibhaag/shared";

export default function FfcsStudentPage() {
  const [activeTab, setActiveTab] = useState<"selection" | "myApplications" | "timetable">("selection");

  const [windowStatus, setWindowStatus] = useState<{
    active: boolean;
    reason?: string;
    window?: FFCSWindow;
    student?: { semester: string; branch: string | null };
  } | null>(null);

  const [offerings, setOfferings] = useState<FFCSOffering[]>([]);
  const [applications, setApplications] = useState<FFCSApplication[]>([]);
  const [liveSeatState, setLiveSeatState] = useState<Record<string, { seatsFilled: number; seatsRemaining: number; status: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const statusRes = await fetchStudentFfcsStatus().catch(() => ({ active: false, reason: "Unable to connect to server." }));
      setWindowStatus(statusRes);

      if (statusRes.active) {
        const offList = await fetchStudentFfcsOfferings().catch(() => []);
        setOfferings(offList);
      }

      const appList = await fetchStudentFfcsApplications().catch(() => []);
      setApplications(appList);
    } catch (err: unknown) {
      setMessage({ text: "Failed to load FFCS portal details", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  useEffect(() => {
    if (!windowStatus?.active || !windowStatus?.window?.id) return;
    const windowId = windowStatus.window.id;
    const liveRef = ref(rtdb, `ffcsLive/${windowId}/offerings`);

    const unsubscribe = onValue(liveRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setLiveSeatState(val);
      }
    });

    return () => unsubscribe();
  }, [windowStatus?.active, windowStatus?.window?.id]);

  const handleSelectOffering = async (offering: FFCSOffering) => {
    if (!windowStatus?.window?.id) return;
    setSubmittingId(offering.id);
    setMessage(null);

    try {
      await submitStudentFfcsApplication({
        windowId: windowStatus.window.id,
        offeringId: offering.id,
      });

      setMessage({ text: `Successfully registered choice for ${offering.subjectName}!`, type: "success" });
      loadStudentData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to select course offering";
      setMessage({ text: msg, type: "error" });
    } finally {
      setSubmittingId(null);
    }
  };

  const groupedBySubject = offerings.reduce((acc, off) => {
    if (!acc[off.subjectId]) {
      acc[off.subjectId] = {
        subjectName: off.subjectName,
        offerings: [],
      };
    }
    acc[off.subjectId].offerings.push(off);
    return acc;
  }, {} as Record<string, { subjectName: string; offerings: FFCSOffering[] }>);

  const appliedOfferingIds = new Set(applications.map((app) => app.offeringId));
  const appliedSubjectIds = new Set(applications.map((app) => app.subjectId));

  const allocatedApps = applications.filter((app) => app.status === "allocated" || app.status === "pending");

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto", color: "#1F2937", background: "#FAF8F5", minHeight: "100vh" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#C85A32" }}>
          Student Portal
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#111827", margin: "4px 0 8px 0" }}>
          FFCS Course Selection
        </h1>
        <p style={{ color: "#6B7280", margin: 0, fontSize: "14px" }}>
          Flexible First Come First Serve — Select your preferred teachers and timetable slots for Semester {windowStatus?.student?.semester || "1"}.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
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

      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E5E0D8", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("selection")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "selection" ? "3px solid #C85A32" : "3px solid transparent",
            color: activeTab === "selection" ? "#C85A32" : "#6B7280",
          }}
        >
          Course Selection
        </button>
        <button
          onClick={() => setActiveTab("myApplications")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "14px",
            border: "none",
            background: "none",
            cursor: "pointer",
            borderBottom: activeTab === "myApplications" ? "3px solid #C85A32" : "3px solid transparent",
            color: activeTab === "myApplications" ? "#C85A32" : "#6B7280",
          }}
        >
          My Selections ({applications.length})
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
          Confirmed Timetable ({allocatedApps.length})
        </button>
      </div>

      {loading ? (
        <div style={{ background: "#FFFFFF", padding: "40px", borderRadius: "12px", border: "1px solid #E5E0D8", textAlign: "center", color: "#6B7280" }}>
          Loading FFCS details...
        </div>
      ) : (
        <>
          {activeTab === "selection" && (
            <div>
              {!windowStatus?.active ? (
                <div style={{ background: "#FFFFFF", padding: "40px", borderRadius: "12px", border: "1px solid #E5E0D8", textAlign: "center" }}>
                  <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔒</div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px 0", color: "#111827" }}>
                    FFCS Selection Unavailable
                  </h3>
                  <p style={{ color: "#6B7280", margin: 0, fontSize: "14px", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
                    {windowStatus?.reason || "FFCS selection is currently not open for your semester."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ background: "#FFFFFF", padding: "16px 20px", borderRadius: "12px", border: "1px solid #E5E0D8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: "16px", color: "#111827" }}>
                        Active Window: Semester {windowStatus.window?.semester} ({windowStatus.window?.academicYear})
                      </span>
                      <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>
                        Closes at {new Date(windowStatus.window?.endDateTime || "").toLocaleString()}
                      </div>
                    </div>

                    <span style={{ fontSize: "13px", fontWeight: 700, padding: "4px 12px", borderRadius: "12px", background: "#DCFCE7", color: "#166534" }}>
                      ● WINDOW OPEN
                    </span>
                  </div>

                  {Object.keys(groupedBySubject).length === 0 ? (
                    <div style={{ background: "#FFFFFF", padding: "32px", borderRadius: "12px", border: "1px solid #E5E0D8", textAlign: "center", color: "#6B7280" }}>
                      No FFCS offerings available for your semester yet.
                    </div>
                  ) : (
                    Object.entries(groupedBySubject).map(([subjectId, group]) => {
                      const isSubjectSelected = appliedSubjectIds.has(subjectId);
                      return (
                        <div key={subjectId} style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E0D8", overflow: "hidden" }}>
                          <div style={{ padding: "16px 20px", background: "#F9FAFB", borderBottom: "1px solid #E5E0D8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                              {group.subjectName}
                            </h3>
                            {isSubjectSelected && (
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534", background: "#DCFCE7", padding: "2px 10px", borderRadius: "12px" }}>
                                Selection Submitted
                              </span>
                            )}
                          </div>

                          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {group.offerings.map((off) => {
                              const rtdbInfo = liveSeatState[off.id];
                              const seatsFilled = rtdbInfo ? rtdbInfo.seatsFilled : off.seatsFilled;
                              const availableSeats = rtdbInfo ? rtdbInfo.seatsRemaining : Math.max(0, off.capacity - off.seatsFilled);
                              const isFull = availableSeats <= 0 || (rtdbInfo ? rtdbInfo.status === "full" : seatsFilled >= off.capacity);
                              const isSelected = appliedOfferingIds.has(off.id);

                              return (
                                <div
                                  key={off.id}
                                  style={{
                                    padding: "14px 16px",
                                    borderRadius: "8px",
                                    border: isSelected ? "2px solid #C85A32" : "1px solid #E5E0D8",
                                    background: isSelected ? "#FDF8F6" : "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>
                                      {off.teacherName}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "#4B5563", marginTop: "2px" }}>
                                      {off.day} · {off.startTime}–{off.endTime} ({off.slotId})
                                    </div>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                    <div style={{ textAlign: "right" }}>
                                      <div style={{ fontSize: "14px", fontWeight: 700, color: isFull ? "#991B1B" : "#166534" }}>
                                        {isFull ? "FULL" : `${availableSeats} / ${off.capacity} seats available`}
                                      </div>
                                    </div>

                                    {isSelected ? (
                                      <span style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 700, borderRadius: "6px", background: "#C85A32", color: "#FFFFFF" }}>
                                        Selected
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleSelectOffering(off)}
                                        disabled={isFull || isSubjectSelected || submittingId === off.id}
                                        style={{
                                          padding: "8px 16px",
                                          fontSize: "13px",
                                          fontWeight: 700,
                                          borderRadius: "6px",
                                          border: "none",
                                          background: isFull || isSubjectSelected ? "#E5E7EB" : "#111827",
                                          color: isFull || isSubjectSelected ? "#9CA3AF" : "#FFFFFF",
                                          cursor: isFull || isSubjectSelected ? "not-allowed" : "pointer",
                                        }}
                                      >
                                        {submittingId === off.id ? "Selecting..." : isFull ? "FULL" : "Select Teacher"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "myApplications" && (
            <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E0D8", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E0D8", fontWeight: 700, fontSize: "15px" }}>
                My Submitted Choices ({applications.length})
              </div>

              {applications.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>
                  You have not selected any FFCS course offerings yet.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#F3F4F6", textAlign: "left", borderBottom: "1px solid #E5E0D8" }}>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Semester</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>CGPA Snapshot</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Submitted At</th>
                      <th style={{ padding: "12px 16px", fontWeight: 700 }}>Allocation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>Sem {app.semester}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                          {app.cgpaSnapshot !== null ? app.cgpaSnapshot.toFixed(2) : "N/A (Sem 1 FCFS)"}
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
                            {app.status}
                          </span>
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
                Confirmed FFCS Weekly Timetable
              </h3>

              {allocatedApps.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#6B7280" }}>
                  No confirmed course allocations yet. Submissions are processed during or after the selection window.
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
                            const matchingApps = allocatedApps.filter((app) => {
                              const offering = offerings.find((o) => o.id === app.offeringId);
                              if (!offering) return false;
                              return offering.day === day && offering.slotId === slot.id;
                            });

                            return (
                              <td key={day} style={{ padding: "8px", border: "1px solid #E5E0D8", textAlign: "center", verticalAlign: "top" }}>
                                {matchingApps.map((app) => {
                                  const offering = offerings.find((o) => o.id === app.offeringId);
                                  const classIdVal = (app as any).classId || (offering as any)?.classId;
                                  return (
                                    <div
                                      key={app.id}
                                      style={{
                                        padding: "6px 8px",
                                        borderRadius: "6px",
                                        background: "#FDF8F6",
                                        border: "1px solid #C85A32",
                                        color: "#111827",
                                        fontWeight: 600,
                                        fontSize: "12px",
                                        textAlign: "left",
                                      }}
                                    >
                                      <div style={{ fontWeight: 700 }}>{offering?.subjectName || "Selected Course"}</div>
                                      <div style={{ fontSize: "11px", color: "#4B5563" }}>{offering?.teacherName}</div>
                                      {classIdVal ? (
                                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#166534", marginTop: "2px", fontFamily: "monospace" }}>
                                          Class ID: {classIdVal}
                                        </div>
                                      ) : (
                                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#C85A32", marginTop: "2px" }}>
                                          ACCEPTED
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
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
