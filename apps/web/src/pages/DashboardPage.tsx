import { useEffect, useState } from "react";
import {
  fetchAttendance,
  fetchLeaveRequests,
  fetchLibraryMaterials,
  fetchSessions,
  fetchUsers,
} from "../lib/api";

type Props = {
  userRole?: string;
  userName?: string;
};

interface MetricState {
  totalStudents: number;
  totalTeachers: number;
  totalSessions: number;
  totalMaterials: number;
  pendingLeaves: number;
  totalAttendance: number;
}

export default function DashboardPage({ userRole = "teacher", userName = "Faculty Member" }: Props) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricState>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSessions: 0,
    totalMaterials: 0,
    pendingLeaves: 0,
    totalAttendance: 0,
  });
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [usersData, sessionsData, materialsData, leavesData, attendanceData] = await Promise.all([
          fetchUsers().catch(() => []),
          fetchSessions().catch(() => []),
          fetchLibraryMaterials().catch(() => []),
          fetchLeaveRequests().catch(() => []),
          fetchAttendance().catch(() => []),
        ]);

        if (isMounted) {
          const studentsCount = Array.isArray(usersData) ? usersData.filter((u: any) => u?.role === "student").length : 0;
          const teachersCount = Array.isArray(usersData) ? usersData.filter((u: any) => u?.role === "faculty" || u?.role === "teacher").length : 0;
          const pendingCount = Array.isArray(leavesData) ? leavesData.filter((l: any) => l?.status === "pending").length : 0;

          setMetrics({
            totalStudents: studentsCount,
            totalTeachers: teachersCount,
            totalSessions: Array.isArray(sessionsData) ? sessionsData.length : 0,
            totalMaterials: Array.isArray(materialsData) ? materialsData.length : 0,
            pendingLeaves: pendingCount,
            totalAttendance: Array.isArray(attendanceData) ? attendanceData.length : 0,
          });

          setSessionsList(Array.isArray(sessionsData) ? sessionsData : []);
        }
      } catch (err) {
        console.warn("Notice loading overview metrics:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
  }, [userRole]);

  return (
    <>
      {/* Clean Solid Hero Header (Matches App Theme, No Gradients) */}
      <section className="hero">
        <div>
          <span className="badge">{userRole === "admin" ? "Campus Overview" : "Faculty Hub"}</span>
          <h2>{userRole === "admin" ? "System Metrics & Administration" : `Welcome, ${userName}`}</h2>
          <p>
            {userRole === "admin"
              ? "Real-time campus database statistics and administrative controls."
              : "Real-time academic statistics, active sessions, study materials, and student leave requests."}
          </p>
        </div>
      </section>

      {/* Real-time KPI Stats Grid */}
      <section className="grid">
        <div className="card">
          <h3>Total Students</h3>
          <div className="kpi">{loading ? "--" : metrics.totalStudents}</div>
          <p>Enrolled student accounts in database.</p>
        </div>

        <div className="card">
          <h3>Total Faculty</h3>
          <div className="kpi">{loading ? "--" : metrics.totalTeachers}</div>
          <p>Active teacher profiles in database.</p>
        </div>

        <div className="card">
          <h3>Class Sessions</h3>
          <div className="kpi">{loading ? "--" : metrics.totalSessions}</div>
          <p>Scheduled academic timetable sessions.</p>
        </div>

        <div className="card">
          <h3>Study Materials</h3>
          <div className="kpi">{loading ? "--" : metrics.totalMaterials}</div>
          <p>Shared digital library resources.</p>
        </div>

        <div className="card">
          <h3>Pending Leaves</h3>
          <div className="kpi">{loading ? "--" : metrics.pendingLeaves}</div>
          <p>Student leave applications awaiting review.</p>
        </div>

        <div className="card">
          <h3>Attendance Logs</h3>
          <div className="kpi">{loading ? "--" : metrics.totalAttendance}</div>
          <p>Total recorded attendance entries.</p>
        </div>
      </section>

      {/* Timetable / Sessions Overview */}
      <section className="card" style={{ marginTop: "8px" }}>
        <h3 style={{ marginBottom: "12px", fontSize: "18px" }}>Classroom Sessions Overview</h3>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading sessions...</p>
        ) : sessionsList.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "12px" }}>
            {sessionsList.map((session, index) => (
              <div
                key={session._id || session.id || index}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--line, #e2d2c1)",
                  background: "var(--bg, #f6f2ea)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>
                  {session.title || session.courseName || `Session #${index + 1}`}
                </div>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  {session.startTime && session.endTime
                    ? `⏰ ${session.startTime} - ${session.endTime}`
                    : session.time
                    ? `⏰ ${session.time}`
                    : "⏰ Time not specified"}
                </div>
                {session.room && (
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    📍 Room: {session.room}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            No sessions are currently registered in the database.
          </p>
        )}
      </section>
    </>
  );
}
