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
import FacultyHomePage from "./pages/FacultyHomePage";
import FacultyLeavePage from "./pages/FacultyLeavePage";
import FacultyClassroomPage from "./pages/FacultyClassroomPage";
import FacultyLibraryPage from "./pages/FacultyLibraryPage";
import FacultyAISummarizerPage from "./pages/FacultyAISummarizerPage";
import FacultyAcademicEventsPage from "./pages/FacultyAcademicEventsPage";
import StudentsPage from "./pages/StudentsPage";
import TeachersPage from "./pages/TeachersPage";

const adminNavItems = [
  { to: "/admin/overview", label: "Overview", icon: BarChart3 },
  { to: "/admin/branches", label: "Branches", icon: GitBranch },
  { to: "/admin/students", label: "Students", icon: GraduationCap },
  { to: "/admin/teachers", label: "Teachers", icon: UserCheck },
  { to: "/admin/attendance", label: "Attendance", icon: ShieldCheck },
  { to: "/admin/sessions", label: "Timetable", icon: CalendarDays },
  { to: "/admin/people", label: "People", icon: Users },
  { to: "/admin/engagement", label: "Engagement", icon: Megaphone },
  { to: "/admin/analytics", label: "Analytics", icon: Layers },
  { to: "/admin/ffcs", label: "FFCS", icon: Grid },
];

const teacherNavItems = [
  { to: "/teacher/dashboard", label: "Faculty Hub", icon: BarChart3 },
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
  return (
    <div className="login-shell" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
      <div style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "12px", fontWeight: 700, color: "#6366f1", marginBottom: "8px" }}>
        Vibhaag Portal
      </div>
      <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "12px", color: "#111827" }}>
        Select Your Campus Portal
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "32px", textAlign: "center", maxWidth: "420px" }}>
        Welcome to Vibhaag College Management System. Please select your role to proceed to the designated portal.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", width: "100%", maxWidth: "800px" }}>
        {/* Admin Card */}
        <div
          onClick={() => navigate("/admin/login")}
          style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          className="portal-card"
        >
          <div style={{ background: "#ecfdf5", color: "#059669", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Shield size={24} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Admin Portal</h3>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Manage departments, branches, system settings, and user access control.</p>
        </div>

        {/* Teacher Card */}
        <div
          onClick={() => navigate("/teacher/login")}
          style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          className="portal-card"
        >
          <div style={{ background: "#eef2ff", color: "#4f46e5", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <BookOpen size={24} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Teacher Portal</h3>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Record attendance, handle student evaluation, leave approvals, and classes.</p>
        </div>

        {/* Student Card */}
        <div
          onClick={() => navigate("/student/login")}
          style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          className="portal-card"
        >
          <div style={{ background: "#eff6ff", color: "#2563eb", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <User size={24} />
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Student Portal</h3>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>View attendance records, schedules, feedback, and campus announcements.</p>
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
            <Route path="/teacher/dashboard" element={<FacultyHomePage />} />
            <Route path="/teacher/attendance" element={<AttendancePage />} />
            <Route path="/teacher/sessions" element={<SessionsPage />} />
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
            <Route path="/admin/overview" element={<DashboardPage />} />
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
