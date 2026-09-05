import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchAnnouncements, fetchLeaveRequests, fetchStudentAttendance, fetchStudentSchedule } from "../lib/api";

type Session = { _id: string; title: string; dayOfWeek: number; startTime: string; endTime: string };
type CourseRegistration = {
  code: string;
  name: string;
  type: string;
  attendance: number;
  remarks: string;
  tone: "good" | "critical" | "steady";
};

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const courseRegistrations: CourseRegistration[] = [
  { code: "CHY1006", name: "Environmental Sustainability", type: "LT", attendance: 100, remarks: "Excellent - Keep going", tone: "good" },
  { code: "CSE2001", name: "Object Oriented Programming with C++", type: "LTP", attendance: 92, remarks: "Excellent - Keep going", tone: "good" },
  { code: "CSE3001", name: "Database Management Systems", type: "LTP", attendance: 100, remarks: "Excellent - Keep going", tone: "good" },
  { code: "DSN2098", name: "Project Exhibition - I", type: "PJ", attendance: 0, remarks: "Critical - must improve", tone: "critical" },
  { code: "ECE2002", name: "Digital Logic Design", type: "LTP", attendance: 92, remarks: "Excellent - Keep going", tone: "good" },
  { code: "EXC0001", name: "EXTRA CURRICULAR ACTIVITIES", type: "PJ", attendance: 0, remarks: "Critical - must improve", tone: "critical" },
  { code: "HUM0002", name: "Swachh Bharat", type: "PJ", attendance: 0, remarks: "Critical - must improve", tone: "critical" },
  { code: "HUM0003", name: "INDIAN CONSTITUTION", type: "LT", attendance: 100, remarks: "Excellent - Keep going", tone: "good" },
  { code: "MAT3002", name: "Applied Linear Algebra", type: "LT", attendance: 100, remarks: "Excellent - Keep going", tone: "good" },
  { code: "MEE2014", name: "Engineering Design and Modelling", type: "LTP", attendance: 88, remarks: "Good", tone: "steady" },
];

export default function StudentHomePage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [announcements, setAnnouncements] = useState<Array<{ _id: string; title: string }>>([]);
  const [attendance, setAttendance] = useState<Array<{ _id: string; status: string }>>([]);
  const [leaveRequests, setLeaveRequests] = useState<Array<{ _id: string; status: string }>>([]);

  useEffect(() => {
    fetchStudentSchedule().then(setSessions).catch(() => setSessions([]));
    fetchAnnouncements().then(setAnnouncements).catch(() => setAnnouncements([]));
    fetchStudentAttendance().then(setAttendance).catch(() => setAttendance([]));
    fetchLeaveRequests().then(setLeaveRequests).catch(() => setLeaveRequests([]));
  }, []);

  const upcoming = useMemo(() => sessions.slice(0, 3), [sessions]);
  const attendanceRate = useMemo(() => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter((row) => row.status === "present").length;
    return Math.round((present / attendance.length) * 100);
  }, [attendance]);

  const pendingLeaves = leaveRequests.filter((item) => item.status === "pending").length;

  return (
    <>
      <section className="hero">
        <div>
          <span className="badge">Student Hub</span>
          <h2>Your attendance and class updates in one feed.</h2>
          <p>Check in, request leave, and stay on top of announcements.</p>
        </div>
        <button className="button" onClick={() => navigate("/leave")}>Request leave</button>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Attendance rate</h3>
          <div className="kpi">{attendanceRate}%</div>
          <p>Based on your recent check-ins.</p>
        </div>
        <div className="card">
          <h3>Pending leaves</h3>
          <div className="kpi">{pendingLeaves}</div>
          <p>Waiting on approval.</p>
        </div>
        <div className="card">
          <h3>Announcements</h3>
          <div className="kpi">{announcements.length}</div>
          <p>New updates for your cohort.</p>
        </div>
      </section>

      <section className="academic-dashboard">
        <div className="registration-panel card">
          <div className="academic-heading">
            <div>
              <span className="eyebrow">Academic overview</span>
              <h3>Current semester course registration</h3>
            </div>
            <span className="semester-tag">Fall Sem 2026-27</span>
          </div>
          <div className="registration-table-wrap">
            <table className="registration-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Code - Course name</th>
                  <th>Type</th>
                  <th>Attendance</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {courseRegistrations.map((course, index) => (
                  <tr key={course.code}>
                    <td data-label="#">{index + 1}</td>
                    <td data-label="Course"><strong>{course.code}</strong><span>{course.name}</span></td>
                    <td data-label="Type"><em>{course.type}</em></td>
                    <td data-label="Attendance" className={`attendance-value ${course.tone}`}>{course.attendance.toFixed(1)}</td>
                    <td data-label="Remarks" className={`remark ${course.tone}`}>{course.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="academic-aside">
          <section className="academic-card card">
            <div className="academic-card-title"><span className="eyebrow">Guidance</span><h3>Proctor message</h3></div>
            <p className="proctor-message">Keep your project and activity courses on track this month. Reach out before the next review if you need support.</p>
            <span className="proctor-name">Dr. Ananya Rao · Faculty mentor</span>
          </section>

          <section className="academic-card card">
            <div className="academic-card-title"><span className="eyebrow">Progress</span><h3>CGPA and credit status</h3></div>
            <dl className="credit-list">
              <div><dt>Total credits required</dt><dd>169</dd></div>
              <div><dt>Earned credits</dt><dd>18.0</dd></div>
              <div className="highlight"><dt>Current CGPA</dt><dd>9.22</dd></div>
            </dl>
          </section>
        </aside>
      </section>

      <section className="spotlight card">
        <div className="academic-heading">
          <div><span className="eyebrow">Stay in the loop</span><h3>Spotlight</h3></div>
          <span className="spotlight-count">1 update</span>
        </div>
        <div className="spotlight-item"><span className="spotlight-icon">↗</span><div><strong>Fall Semester TEE Feedback Link (FT)</strong><p>Academic feedback is open for your current semester.</p></div><button className="button secondary">View update</button></div>
      </section>

      <section className="card">
        <div className="section-title">
          <h3>Upcoming sessions</h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Day</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((session) => (
                <tr key={session._id}>
                  <td data-label="Session">{session.title}</td>
                  <td data-label="Day">{days[session.dayOfWeek]}</td>
                  <td data-label="Time">
                    {session.startTime} - {session.endTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
