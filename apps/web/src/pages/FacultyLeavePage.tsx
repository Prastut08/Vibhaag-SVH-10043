import { useEffect, useState } from "react";
import { fetchLeaveRequests, updateLeaveRequest, type LeaveRequest } from "../lib/api";

export default function FacultyLeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveRequests()
      .then(setLeaveRequests)
      .catch(() => setLeaveRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id: string, status: "approved" | "rejected") => {
    await updateLeaveRequest(id, status);
    const updated = await fetchLeaveRequests();
    setLeaveRequests(updated);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="hero">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>📝</span>
            <h2 style={{ margin: 0 }}>Leave Management</h2>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Review and manage student leave requests.
          </p>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          ⏳ Loading leave requests…
        </div>
      )}

      {!loading && (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((req) => (
                  <tr key={req._id}>
                    <td data-label="Student">{req.studentName || req._id}</td>
                    <td data-label="Date">{req.date}</td>
                    <td data-label="Reason">{req.reason}</td>
                    <td data-label="Status">
                      <span className={`badge ${req.status === "approved" ? "badge-success" : req.status === "rejected" ? "badge-danger" : "badge-warning"}`}>
                        {req.status}
                      </span>
                    </td>
                    <td data-label="Action">
                      {req.status === "pending" && (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="button" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => handleStatus(req._id, "approved")}>
                            ✅ Approve
                          </button>
                          <button className="button secondary" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => handleStatus(req._id, "rejected")}>
                            ❌ Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {leaveRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)" }}>
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
