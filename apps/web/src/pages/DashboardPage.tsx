import { useEffect, useState } from "react";
import { fetchAdminOverview } from "../lib/api";

interface OverviewMetrics {
  totalStudents: number;
  totalTeachers: number;
  totalBranches: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminOverview()
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load overview data");
        setLoading(false);
      });
  }, []);

  return (
    <>
      <section className="hero">
        <div>
          <span className="badge">Campus Overview</span>
          <h2>System Metrics & Administration</h2>
          <p>Real-time campus database statistics and administrative controls.</p>
        </div>
      </section>

      {error ? <div className="notice" style={{ background: "#fef2f2", color: "#dc2626" }}>{error}</div> : null}

      <section className="grid">
        <div className="card">
          <h3>Total Students</h3>
          <div className="kpi">{loading ? "--" : (metrics?.totalStudents ?? 0)}</div>
          <p>Enrolled student accounts in Firestore.</p>
        </div>

        <div className="card">
          <h3>Total Teachers</h3>
          <div className="kpi">{loading ? "--" : (metrics?.totalTeachers ?? 0)}</div>
          <p>Faculty member profiles in Firestore.</p>
        </div>

        <div className="card">
          <h3>Total Branches</h3>
          <div className="kpi">{loading ? "--" : (metrics?.totalBranches ?? 0)}</div>
          <p>Active academic branches defined.</p>
        </div>

        <div className="card">
          <h3>7-Day Attendance</h3>
          <div className="kpi" style={{ fontSize: "18px", color: "var(--muted)" }}>Not available yet</div>
          <p>Attendance tracking engine pending initialization.</p>
        </div>

        <div className="card">
          <h3>Active Signals</h3>
          <div className="kpi" style={{ fontSize: "18px", color: "var(--muted)" }}>Not available yet</div>
          <p>Leave requests and student feedback signals.</p>
        </div>
      </section>
    </>
  );
}
