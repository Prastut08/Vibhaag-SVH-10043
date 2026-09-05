import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";

import { fetchStudentAttendance } from "../lib/api";

type Attendance = { _id: string; date: string; status: string; checkInAt: string | null };

const courses = [
  ["CHY1006", "Environmental Sustainability - Lecture and Tutorial Hours Only", "BL2026270101123 - E14 - AB-229", "HIMANSHI HARISH SHARMA - SASL", 6, 6],
  ["CSE2001", "Object Oriented Programming with C++ - Lecture and Tutorial, practical hours only", "BL2026270100319 - C11+C12+C13 - AB02-325", "RAM KUMAR - SCOPE", 22, 24],
  ["CSE3001", "Database Management Systems - Lecture and Tutorial hours only", "BL2026270100471 - A14+D11+D12 - AB02-316", "RIZWAN UR RAHMAN - SCAI", 21, 21],
  ["DSN2098", "Project Exhibition - I - Project Only", "BL2026270100854 - NIL", "VIKAS PANTHI - SCOPE", 0, 0],
  ["ECE2002", "Digital Logic Design - Lecture and Tutorial, practical hours only", "BL2026270100931 - A11+A12+A13 - AB-313", "RUPESH KUMARI - SEEE", 18, 20],
] as const;

export default function StudentAttendancePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentAttendance().then(setAttendance).catch(() => setAttendance([]));
  }, []);

  return (
    <div className="attendance-page">
      <section className="attendance-heading"><h2>Attendance Information:</h2><p><strong>* Note:</strong> As per norms, <b>Virtual Slots &amp; Medical Leave</b> are not included in attendance percentage calculation.</p></section>
      <section className="attendance-table-card card"><div className="section-title"><div><span className="eyebrow">Semester 2026-27</span><h3>Course-wise attendance</h3></div><span className="status-pill">{courses.length} courses</span></div><div className="attendance-table-wrap"><table className="attendance-detail-table"><thead><tr><th>Sl.No.</th><th>Class group</th><th>Course detail</th><th>Class detail</th><th>Faculty detail</th><th>Attended classes/days</th><th>Total classes</th><th>Attendance percentage</th><th>Debar status</th><th>Attendance detail</th></tr></thead><tbody>{courses.map(([code, name, classId, faculty, attended, total], index) => { const percentage = total ? Math.round((attended / total) * 100) : 0; return <tr key={code}><td data-label="Sl.No.">{index + 1}</td><td data-label="Class group">General</td><td data-label="Course detail"><strong>{code}</strong><span>{name}</span></td><td data-label="Class detail">{classId}</td><td data-label="Faculty detail">{faculty}</td><td data-label="Attended classes/days">{attended}</td><td data-label="Total classes">{total}</td><td data-label="Attendance percentage" className={percentage < 75 ? "attendance-low" : "attendance-good"}>{total ? `${percentage}%` : "--"}</td><td data-label="Debar status">{percentage > 0 && percentage < 75 ? "Review required" : "-"}</td><td data-label="Attendance detail"><button className="icon-button" onClick={() => setSelected(code)} aria-label={`View ${code} details`}><Eye size={18} /></button></td></tr>; })}</tbody></table></div></section>
      {selected ? <div className="attendance-detail-overlay" onClick={() => setSelected(null)}><section className="attendance-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="section-title"><div><span className="eyebrow">Attendance detail</span><h3>{selected}</h3></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button></div><div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Class status</th></tr></thead><tbody>{attendance.length ? attendance.map((row) => <tr key={row._id}><td data-label="Date">{row.date}</td><td data-label="Class status">{row.status}</td></tr>) : <tr><td colSpan={2}>No attendance records yet.</td></tr>}</tbody></table></div></section></div> : null}
    </div>
  );
}
