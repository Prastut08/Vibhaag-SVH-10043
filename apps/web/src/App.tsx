import { useEffect, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  GitBranch,
  GraduationCap,
  Layers,
  LogOut,
  Megaphone,
  ShieldCheck,
  UserCheck,
  Users,
  Shield,
  User,
  BookOpen,
  Grid,
  Library,
  MessageSquare,
  School,
  FileText,
  Video,
} from "lucide-react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { fetchMe, logout } from "./lib/api";
import AdminLoginPage from "./pages/AdminLoginPage";
import StudentLoginPage from "./pages/StudentLoginPage";
import TeacherLoginPage from "./pages/TeacherLoginPage";
import AdminEngagementPage from "./pages/AdminEngagementPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AttendancePage from "./pages/AttendancePage";
import BranchesPage from "./pages/BranchesPage";
import DashboardPage from "./pages/DashboardPage";
import FfcsAdminPage from "./pages/FfcsAdminPage";
import FfcsFacultyPage from "./pages/FfcsFacultyPage";
import FfcsStudentPage from "./pages/FfcsStudentPage";
import PeoplePage from "./pages/PeoplePage";
import SessionsPage from "./pages/SessionsPage";
import StudentAnnouncementsPage from "./pages/StudentAnnouncementsPage";
import StudentAttendancePage from "./pages/StudentAttendancePage";
import StudentClassroomPage from "./pages/StudentClassroomPage";
import StudentFeedbackPage from "./pages/StudentFeedbackPage";
import StudentHomePage from "./pages/StudentHomePage";
import StudentLeavePage from "./pages/StudentLeavePage";
import StudentSchedulePage from "./pages/StudentSchedulePage";
import StudentLibraryPage from "./pages/StudentLibraryPage";
import FacultyLeavePage from "./pages/FacultyLeavePage";
import FacultyClassroomPage from "./pages/FacultyClassroomPage";
import FacultyLibraryPage from "./pages/FacultyLibraryPage";
import FacultyAISummarizerPage from "./pages/FacultyAISummarizerPage";
import FacultyAcademicEventsPage from "./pages/FacultyAcademicEventsPage";
import StudentsPage from "./pages/StudentsPage";
import TeachersPage from "./pages/TeachersPage";
import TeacherClassesPage from "./pages/TeacherClassesPage";

const adminNavItems = [
  { to: "/admin/overview", label: "Overview", icon: BarChart3 },
  { to: "/admin/branches", label: "Branches", icon: GitBranch },
  { to: "/admin/students", label: "Students", icon: GraduationCap },
  { to: "/admin/teachers", label: "Teachers", icon: UserCheck },
  { to: "/admin/attendance", label: "Attendance", icon: ShieldCheck },
  { to: "/admin/sessions", label: "Timetable", icon: CalendarDays },
  { to: "/admin/engagement", label: "Engagement", icon: Megaphone },
  { to: "/admin/analytics", label: "Analytics", icon: Layers },
  { to: "/admin/ffcs", label: "FFCS", icon: Grid },
];

const teacherNavItems = [
  { to: "/teacher/dashboard", label: "Faculty Hub", icon: BarChart3 },
  { to: "/teacher/classes", label: "My Classes", icon: School },
  { to: "/teacher/attendance", label: "Attendance", icon: ShieldCheck },
  { to: "/teacher/sessions", label: "Timetable", icon: CalendarDays },
  { to: "/teacher/ffcs", label: "FFCS", icon: Grid },
  { to: "/teacher/leave", label: "Leave", icon: FileText },
  { to: "/teacher/classroom", label: "Classroom", icon: School },
  { to: "/teacher/library", label: "Library", icon: Library },
  { to: "/teacher/ai-summarizer", label: "AI Summarizer", icon: MessageSquare },
  { to: "/teacher/events", label: "Academic Events", icon: BookOpen },
];

// ── Faculty nav
const facultyNavItems = [
  { to: "/", label: "Overview", icon: BarChart3 },
  { to: "/sessions", label: "Timetable", icon: CalendarDays },
  { to: "/attendance", label: "Attendance", icon: ShieldCheck },
  { to: "/ffcs", label: "FFCS", icon: Grid },
  { to: "/faculty/leave", label: "Leave", icon: FileText },
  { to: "/faculty/classroom", label: "Classroom", icon: School },
  { to: "/faculty/library", label: "Library", icon: Library },
  { to: "/faculty/ai-summarizer", label: "AI Summarizer", icon: MessageSquare },
  { to: "/faculty/events", label: "Academic Events", icon: BookOpen },
];

const studentNavItems = [
  { to: "/student/dashboard", label: "My Hub", icon: BarChart3 },
  { to: "/student/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/student/attendance", label: "My Attendance", icon: ShieldCheck },
  { to: "/student/classroom", label: "Classroom", icon: Video },
  { to: "/student/announcements", label: "Announcements", icon: Layers },
  { to: "/student/leave", label: "Leave Requests", icon: Users },
  { to: "/student/feedback", label: "Session Feedback", icon: Megaphone },
  { to: "/student/library", label: "Library", icon: Library },
  { to: "/student/ffcs", label: "FFCS", icon: Grid },
];

function PortalSelectionPage() {
  const navigate = useNavigate();
  const ShieldIllustration = () => <svg className="portal-illustration" fill="none" viewBox="0 0 80 84" aria-hidden="true"><path d="M40 78C62 67 69 46 69 22C69 20 40 10 40 10C40 10 11 20 11 22C11 46 18 67 40 78Z" fill="#FFF7DD" stroke="#2B2D2F" strokeLinejoin="round" strokeWidth="2.6" /><path d="M40 72C58 62 63.5 43 63.5 24C63.5 22 40 14 40 14C40 14 16.5 22 16.5 24C16.5 43 22 62 40 72Z" stroke="#876527" strokeLinejoin="round" strokeWidth="2.4" /><path d="M40 28L43.8 36.8L53.2 37.8L46.1 44.1L48.1 53.4L40 48.7L31.9 53.4L33.9 44.1L26.8 37.8L36.2 36.8L40 28Z" fill="#D8A033" stroke="#2B2D2F" strokeLinejoin="round" strokeWidth="2.2" /></svg>;
  const BookIllustration = () => <svg className="portal-illustration" fill="none" viewBox="0 0 84 80" aria-hidden="true"><path d="M12 60C24 55 39 56 42 61C45 56 60 55 72 60V23C60 18 45 19 42 24C39 19 24 18 12 23V60Z" fill="#5A4736" stroke="#2B2D2F" strokeLinejoin="round" strokeWidth="2.6" /><path d="M14 20C26 15 40 16 42 22C44 16 58 15 70 20V56C58 51 44 52 42 58C40 52 26 51 14 56V20Z" fill="#FFF7DD" stroke="#2B2D2F" strokeLinejoin="round" strokeWidth="2.6" /><path d="M42 22V58" stroke="#2B2D2F" strokeLinecap="round" strokeWidth="2.4" /><path d="M20 29L35 28M20 36L35 35M20 43L35 42M49 28L64 29M49 35L64 36M49 42L64 43" stroke="#9A8E7D" strokeLinecap="round" strokeWidth="1.8" /><g transform="rotate(42 47 32)"><rect width="6" height="23" x="42" y="16" fill="#3D5A80" stroke="#2B2D2F" strokeWidth="2" /><path d="M42 39L45 46L48 39H42Z" fill="#F0C767" stroke="#2B2D2F" strokeLinejoin="round" strokeWidth="2" /></g></svg>;
  const StudentIllustration = () => <svg className="portal-illustration" fill="none" viewBox="0 0 80 80" aria-hidden="true"><path d="M28 32V42C28 46 33 50 40 50C47 50 52 46 52 42V32" fill="#2A3847" stroke="#2B2D2F" strokeLinejoin="round" strokeWidth="2.6" /><polygon points="40,16 68,26 40,36 12,26" fill="#4A637C" stroke="#2B2D2F" strokeLinejoin="round" strokeWidth="2.6" /><circle cx="40" cy="26" r="2.2" fill="#2B2D2F" /><path d="M40 26L60 35V45" stroke="#C49B24" strokeLinecap="round" strokeWidth="2.2" /><rect width="4" height="6" x="58" y="45" fill="#C49B24" stroke="#2B2D2F" strokeWidth="1.8" /><g transform="rotate(-15 32 58)"><rect width="30" height="9" x="18" y="54" fill="#FFF7DD" stroke="#2B2D2F" strokeWidth="2.2" /><rect width="4" height="11" x="31" y="53" fill="#B33927" stroke="#2B2D2F" strokeWidth="1.6" /></g></svg>;
  return (
    <div className="portal-container">
      <div className="content-wrapper">
        <span className="portal-tag">Vibhaag Portal</span>
        <h1 className="main-title">Select Your Campus Portal</h1>
        <p className="subtitle">Welcome to Vibhaag College Management System.<br />Please select your role to proceed to the designated portal.</p>
        <div className="cards-grid">
          <div className="portal-card portal-card-admin" onClick={() => navigate("/admin/login")}>
            <div><ShieldIllustration /><h2 className="card-title">Admin Portal</h2><p className="card-description">Streamline campus management, departments, security, and institutional settings.</p></div>
            <button className="card-button" onClick={() => navigate("/admin/login")}>Enter Admin Portal</button>
          </div>
          <div className="portal-card portal-card-teacher" onClick={() => navigate("/teacher/login")}>
            <div><BookIllustration /><h2 className="card-title">Teacher Portal</h2><p className="card-description">Foster student growth, manage coursework, grading, and leave applications.</p></div>
            <button className="card-button" onClick={() => navigate("/teacher/login")}>Enter Teacher Portal</button>
          </div>
          <div className="portal-card portal-card-student" onClick={() => navigate("/student/login")}>
            <div><StudentIllustration /><h2 className="card-title">Student Portal</h2><p className="card-description">Access academic records, class schedules, campus news, and essential services.</p></div>
            <button className="card-button" onClick={() => navigate("/student/login")}>Enter Student Portal</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [booting, setBooting] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchMe();
          setUser({ name: profile.name, role: profile.role });
        } catch {
          await logout();
          setUser(null);
        } finally {
          setBooting(false);
        }
      } else {
        localStorage.removeItem("vibhaag-token");
        setUser(null);
        setBooting(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const role = user?.role;
    await logout();
    setUser(null);
    if (role === "admin") {
      navigate("/admin/login");
    } else if (role === "student") {
      navigate("/student/login");
    } else if (role === "teacher") {
      navigate("/teacher/login");
    } else {
      navigate("/");
    }
  };

  const handleAuthSuccess = (userData: { name: string; role: string }) => {
    setUser(userData);
    if (userData.role === "admin") {
      navigate("/admin/overview");
    } else if (userData.role === "student") {
      navigate("/student/dashboard");
    } else if (userData.role === "teacher") {
      navigate("/teacher/dashboard");
    }
  };

  if (booting) {
    return <div className="login-shell" style={{ color: "#4b5563", fontSize: "16px" }}>Authenticating session...</div>;
  }

  // Unauthenticated users
  if (!user) {
    return (
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/student/login" element={<StudentLoginPage onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/teacher/login" element={<TeacherLoginPage onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/" element={<PortalSelectionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Student authenticated view
  if (user.role === "student") {
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/teacher")) {
      return <Navigate to="/student/dashboard" replace />;
    }

    return (
      <div className="app-shell fade-in">
        <aside className="sidebar">
          <div>
            <h1>Vibhaag</h1>
            <p>{user.name} (Student)</p>
          </div>
          <nav className="nav-group">
            {studentNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={(props) => `nav-link${props.isActive ? " active" : ""}`}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button className="button secondary" onClick={handleLogout} style={{ marginTop: "auto" }}>
            <LogOut size={16} /> Logout
          </button>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/student/dashboard" element={<StudentHomePage />} />
            <Route path="/student/schedule" element={<StudentSchedulePage />} />
            <Route path="/student/attendance" element={<StudentAttendancePage />} />
            <Route path="/student/classroom" element={<StudentClassroomPage />} />
            <Route path="/student/announcements" element={<StudentAnnouncementsPage />} />
            <Route path="/student/leave" element={<StudentLeavePage />} />
            <Route path="/student/feedback" element={<StudentFeedbackPage />} />
            <Route path="/student/library" element={<StudentLibraryPage />} />
            <Route path="/student/ffcs" element={<FfcsStudentPage />} />
            <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Teacher authenticated view
  if (user.role === "teacher" || user.role === "faculty") {
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/student")) {
      return <Navigate to="/teacher/dashboard" replace />;
    }

    return (
      <div className="app-shell fade-in">
        <aside className="sidebar">
          <div>
            <h1>Vibhaag</h1>
            <p>{user.name} (Teacher)</p>
          </div>
          <nav className="nav-group">
            {teacherNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={(props) => `nav-link${props.isActive ? " active" : ""}`}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button className="button secondary" onClick={handleLogout} style={{ marginTop: "auto" }}>
            <LogOut size={16} /> Logout
          </button>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/teacher/dashboard" element={<DashboardPage userRole="teacher" userName={user.name} />} />
            <Route path="/teacher/classes" element={<TeacherClassesPage />} />
            <Route path="/teacher/attendance" element={<AttendancePage />} />
            <Route path="/teacher/sessions" element={<SessionsPage />} />
            <Route path="/teacher/people" element={<PeoplePage />} />
            <Route path="/teacher/ffcs" element={<FfcsFacultyPage />} />
            <Route path="/teacher/leave" element={<FacultyLeavePage />} />
            <Route path="/teacher/classroom" element={<FacultyClassroomPage />} />
            <Route path="/teacher/library" element={<FacultyLibraryPage />} />
            <Route path="/teacher/ai-summarizer" element={<FacultyAISummarizerPage />} />
            <Route path="/teacher/events" element={<FacultyAcademicEventsPage />} />
            <Route path="/" element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Admin authenticated view
  if (user.role === "admin") {
    if (location.pathname.startsWith("/student") || location.pathname.startsWith("/teacher")) {
      return <Navigate to="/admin/overview" replace />;
    }

    return (
      <div className="app-shell fade-in">
        <aside className="sidebar">
          <div>
            <h1>Vibhaag</h1>
            <p>{user.name} (Admin)</p>
          </div>
          <nav className="nav-group">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={(props) => `nav-link${props.isActive ? " active" : ""}`}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button className="button secondary" onClick={handleLogout} style={{ marginTop: "auto" }}>
            <LogOut size={16} /> Logout
          </button>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/admin/overview" element={<DashboardPage userRole="admin" userName={user.name} />} />
            <Route path="/admin/branches" element={<BranchesPage />} />
            <Route path="/admin/students" element={<StudentsPage />} />
            <Route path="/admin/teachers" element={<TeachersPage />} />
            <Route path="/admin/attendance" element={<AttendancePage />} />
            <Route path="/admin/sessions" element={<SessionsPage />} />
            <Route path="/admin/people" element={<PeoplePage />} />
            <Route path="/admin/engagement" element={<AdminEngagementPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/ffcs" element={<FfcsAdminPage />} />
            <Route path="/" element={<Navigate to="/admin/overview" replace />} />
            <Route path="*" element={<Navigate to="/admin/overview" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  );
}
