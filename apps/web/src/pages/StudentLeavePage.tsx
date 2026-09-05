import { useEffect, useState } from "react";

import { createLeaveRequest, fetchLeaveRequests, fetchStudentSchedule } from "../lib/api";

type Session = { _id: string; title: string };

type LeaveRequest = { _id: string; date: string; status: string; reason: string; issuingAuthority?: string };

export default function StudentLeavePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [visitingPlace, setVisitingPlace] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [toDate, setToDate] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentSchedule().then(setSessions).catch(() => setSessions([]));
    fetchLeaveRequests().then(setLeaveRequests).catch(() => setLeaveRequests([]));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      await createLeaveRequest(sessionId, fromDate, reason);
      const updated = await fetchLeaveRequests();
      setLeaveRequests(updated);
      setSessionId("");
      setLeaveType(""); setVisitingPlace(""); setFromDate(""); setTimeFrom(""); setToDate(""); setTimeTo("");
      setReason("");
      setMessage("Leave request submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  };

  return (
    <div className="leave-page">
      <div className="leave-form-card card"><div className="section-title"><div><span className="eyebrow">Student services</span><h3>Leave Request</h3></div><span className="status-pill">Hostel approval</span></div><p className="leave-authority"><strong>Issuing Authority:</strong> Hostel Authorities</p><form onSubmit={handleSubmit} className="leave-form-grid">
          <label className="input">Leave Type<select value={leaveType} onChange={(event) => setLeaveType(event.target.value)} required><option value="">Select leave type</option><option>Day scholar leave</option><option>Hostel outpass</option><option>Medical leave</option><option>Emergency leave</option></select></label>
          <label className="input">Visiting Place<input value={visitingPlace} onChange={(event) => setVisitingPlace(event.target.value)} required /></label>
          <label className="input">
            Related Session
            <select value={sessionId} onChange={(event) => setSessionId(event.target.value)} required>
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session._id} value={session._id}>
                  {session.title}
                </option>
              ))}
            </select>
          </label>
          <label className="input">From Date<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} required /></label><label className="input">Time From<input type="time" value={timeFrom} onChange={(event) => setTimeFrom(event.target.value)} required /></label><label className="input">To Date<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} required /></label><label className="input">Time To<input type="time" value={timeTo} onChange={(event) => setTimeTo(event.target.value)} required /></label><label className="input">Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} required /></label><div className="leave-submit-row"><button className="button" type="submit">Submit Leave Request</button></div>
        </form>
        {message ? <div className="notice">{message}</div> : null}
      </div>
      <div className="leave-status-card card">
        <div className="section-title">
          <div><span className="eyebrow">Hostel workflow</span><h3>Leave Status</h3></div><span className="status-pill">Approval tracking</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Leave date</th><th>Leave status</th><th>Issuing authority</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((item) => (
                <tr key={item._id}>
                  <td data-label="Leave date">{item.date}</td><td data-label="Leave status"><span className={`leave-status ${item.status}`}>{item.status === "approved" ? "Approved" : item.status === "denied" ? "Not approved" : "Pending approval"}</span></td><td data-label="Issuing authority">{item.issuingAuthority ?? "Hostel Authorities"}</td>
                  <td data-label="Reason">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
