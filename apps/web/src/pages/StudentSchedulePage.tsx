import { useEffect, useMemo, useState } from "react";

import { fetchStudentSchedule } from "../lib/api";

type Session = { _id: string; title: string; dayOfWeek: number; startTime: string; endTime: string };

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const timeSlots = ["08:30", "10:05", "11:40", "13:15", "14:50", "16:25", "18:00"];
const details = [
  ["CHY1006", "Environmental Sustainability", "University Core", "BL2026270101123", "Himanshi Harish Sharma - SASL", "E14 - AB-229"],
  ["CSE2001", "Object Oriented Programming with C++", "Programme Core", "BL2026270100319", "Ram Kumar - SCOPE", "C11+C12+C13 - AB02-325"],
  ["CSE3001", "Database Management Systems", "Programme Core", "BL2026270100471", "Rizwan Ur Rahman - SCAI", "A14+D11+D12 - AB02-316"],
  ["DSN2098", "Project Exhibition - I", "Project and Internships", "BL2026270100854", "Vikas Panthi - SCOPE", "NIL"],
  ["ECE2002", "Digital Logic Design", "Programme Core", "BL2026270100931", "Rupesh Kumari - SEEE", "A11+A12+A13 - AB-313"],
] as const;

export default function StudentSchedulePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    fetchStudentSchedule().then(setSessions).catch(() => setSessions([]));
  }, []);

  const today = Math.max(0, Math.min(5, new Date().getDay() - 1));
  const daySessions = useMemo(() => sessions.filter((session) => session.dayOfWeek === selectedDay + 1), [selectedDay, sessions]);
  const formatTime = (value: string) => { const [hour, minute] = value.split(":").map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`; };

  return (
    <div className="schedule-page">
      <section className="schedule-hero"><div><span className="eyebrow">Academic planner</span><h2>My timetable</h2><p>Course registration and weekly class details.</p></div><div className="schedule-stats"><div><strong>{sessions.length}</strong><span>classes this week</span></div><div><strong>{daySessions.length}</strong><span>on {days[selectedDay]}</span></div></div></section>
      <section className="card registration-card"><div className="section-title"><div><span className="eyebrow">Semester 2026-27</span><h3>Timetable course details</h3></div><span className="status-pill">{details.length} approved</span></div><div className="schedule-table-wrap"><table className="schedule-registration-table"><thead><tr><th>#</th><th>Class group</th><th>Course detail</th><th>Class detail</th><th>Faculty detail</th><th>Slot / venue</th><th>Status</th></tr></thead><tbody>{details.map(([code, name, category, classId, faculty, venue], index) => <tr key={code}><td>{index + 1}</td><td>General</td><td><strong>{code}</strong><span>{name}</span></td><td>{classId} - {category}</td><td>{faculty}</td><td>{venue}</td><td><span className="approved-status">Registered and Approved</span></td></tr>)}</tbody></table></div></section>
      <section className="card timetable-card"><div className="section-title"><div><span className="eyebrow">Weekly view</span><h3>Class timetable</h3></div></div><div className="day-tabs" role="tablist">{days.map((day, index) => <button key={day} className={`day-tab${selectedDay === index ? " active" : ""}`} onClick={() => setSelectedDay(index)} role="tab" aria-selected={selectedDay === index}><span>{day}</span><small>{index === today ? "Today" : `${sessions.filter((session) => session.dayOfWeek === index + 1).length} classes`}</small></button>)}</div><div className="timetable-wrap"><div className="timetable-header"><span>Day</span>{timeSlots.map((slot) => <span key={slot}>{formatTime(slot)}</span>)}</div><div className="timetable-body">{days.map((day, dayIndex) => { const classes = sessions.filter((session) => session.dayOfWeek === dayIndex + 1); return <div className={`timetable-row${selectedDay === dayIndex ? " focused" : ""}`} key={day}><button className="timetable-day" onClick={() => setSelectedDay(dayIndex)}><strong>{day}</strong><span>{dayIndex === today ? "Today" : `${classes.length} classes`}</span></button><div className="timetable-track">{classes.length ? classes.map((session) => <article className="class-block blue" key={session._id}><strong>{session.title}</strong><span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span><small>Room AB02-316</small></article>) : <div className="empty-schedule">No classes</div>}</div></div>; })}</div></div><div className="timetable-note">Weekly class schedule <span className="next-class">Next class: {daySessions[0]?.title ?? "Enjoy your free day"}</span></div></section>
    </div>
  );
}
