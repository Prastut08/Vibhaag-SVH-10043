import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  Grid,
  Layers,
  Library,
  LogOut,
  Megaphone,
  ShieldCheck,
  Users,
  BookOpen,
  MessageSquare,
  School,
  FileText,
} from "lucide-react";

import { fetchAuthStatus, fetchMe, login, logout, bootstrapAdmin } from "./lib/api";
import AdminEngagementPage from "./pages/AdminEngagementPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AttendancePage from "./pages/AttendancePage";
import DashboardPage from "./pages/DashboardPage";
import FfcsAdminPage from "./pages/FfcsAdminPage";
import FfcsFacultyPage from "./pages/FfcsFacultyPage";
import FfcsStudentPage from "./pages/FfcsStudentPage";
import PeoplePage from "./pages/PeoplePage";
import SessionsPage from "./pages/SessionsPage";
import StudentAnnouncementsPage from "./pages/StudentAnnouncementsPage";
import StudentAttendancePage from "./pages/StudentAttendancePage";
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

// ── Admin nav
const adminNavItems = [
  { to: "/", label: "Overview", icon: BarChart3 },
  { to: "/attendance", label: "Attendance", icon: ShieldCheck },
  { to: "/sessions", label: "Timetable", icon: CalendarDays },
  { to: "/people", label: "People", icon: Users },
  { to: "/engagement", label: "Engagement", icon: Megaphone },
  { to: "/analytics", label: "Analytics", icon: Layers },
  { to: "/ffcs", label: "FFCS", icon: Grid },
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

// ── Student nav
const studentNavItems = [
  { to: "/", label: "My Hub", icon: BarChart3 },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/attendance", label: "My Attendance", icon: ShieldCheck },
  { to: "/announcements", label: "Announcements", icon: Layers },
  { to: "/leave", label: "Leave Requests", icon: Users },
  { to: "/feedback", label: "Session Feedback", icon: Megaphone },
  { to: "/library", label: "Library", icon: Library },
  { to: "/ffcs", label: "FFCS", icon: Grid },
];

// ── Role accent colours
const ROLE_COLORS: Record<string, string> = {
  admin: "#059669",
  faculty: "#4f46e5",
  student: "#2563eb",
};

function AuthScreen({ onAuthSuccess }: { onAuthSuccess: (user: { name: string; role: string }) => void }) {
  const [userType, setUserType] = useState<"student" | "faculty" | "admin">("student");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { loginRoleBased, signUpRoleBased } = await import("./lib/api");
      if (isSignUp) {
        if (!name) throw new Error("Please enter your name");
        const user = await signUpRoleBased({
          name,
          email,
          password,
          userType,
          rollNumber: userType === "student" ? rollNumber : undefined,
          department: userType !== "admin" ? department : undefined,
          designation: userType === "faculty" ? designation : undefined,
        });
        onAuthSuccess({ name: user.name, role: userType });
      } else {
        const user = await loginRoleBased(email, password, userType);
        onAuthSuccess({ name: user.name, role: userType });
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  const userTypeTitle = userType === "student" ? "Student" : userType === "faculty" ? "Faculty" : "Admin";
  const accentColor = ROLE_COLORS[userType];

  return (
    <div className="login-shell">
      <div className="login-card fade-in" style={{ maxWidth: "480px", width: "100%" }}>
        {/* Portal selector */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", background: "#e5e7eb", padding: "4px", borderRadius: "10px" }}>
          {(["student", "faculty", "admin"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className="button"
              id={`portal-${type}`}
              style={{
                flex: 1,
                padding: "8px 4px",
                fontSize: "13px",
                fontWeight: 600,
                background: userType === type ? ROLE_COLORS[type] : "transparent",
                color: userType === type ? "#ffffff" : "#374151",
                transition: "background 0.2s",
              }}
              onClick={() => { setUserType(type); setError(null); }}
            >
              {type === "student" ? "🎓 Student" : type === "faculty" ? "👨‍🏫 Faculty" : "🛠️ Admin"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px", textAlign: "center" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>
              {userTypeTitle} {isSignUp ? "Registration" : "Portal Login"}
            </h2>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              {isSignUp
                ? `Create a new ${userTypeTitle} account`
                : `Sign in to access the ${userTypeTitle} dashboard`}
            </p>
          </div>

          {/* Sign In / Sign Up toggle */}
          <div style={{ display: "flex", gap: "8px", background: "#f3f4f6", padding: "4px", borderRadius: "8px", marginBottom: "16px" }}>
            <button
              type="button"
              className={`button ${!isSignUp ? "" : "secondary"}`}
              style={{ flex: 1, padding: "6px" }}
              onClick={() => { setIsSignUp(false); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`button ${isSignUp ? "" : "secondary"}`}
              style={{ flex: 1, padding: "6px" }}
              onClick={() => { setIsSignUp(true); setError(null); }}
            >
              Sign Up
            </button>
          </div>

          {isSignUp && (
            <label className="input">
              Full Name
              <input
                type="text"
                placeholder={userType === "student" ? "e.g. Rahul Sharma" : userType === "faculty" ? "e.g. Dr. Ananya Roy" : "e.g. Campus Admin"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}

          {isSignUp && userType === "student" && (
            <label className="input">
              Roll / Enrollment Number
              <input
                type="text"
                placeholder="e.g. CS-2024-042"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
            </label>
          )}

          {isSignUp && (userType === "student" || userType === "faculty") && (
            <label className="input">
              Department
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </label>
          )}

          {isSignUp && userType === "faculty" && (
            <label className="input">
              Designation
              <input
                type="text"
                placeholder="e.g. Associate Professor"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                required
              />
            </label>
          )}

          <label className="input">
            {userTypeTitle} Email address
            <input
              type="email"
              id={`${userType}-email`}
              placeholder={`${userType}@vibhaag.dev`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="input">
            Password
            <input
              type="password"
              id={`${userType}-password`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <div className="notice" style={{ background: "#b91c1c" }}>{error}</div> : null}

          <button
            className="button"
            type="submit"
            id={`${userType}-submit`}
            disabled={loading}
            style={{ width: "100%", marginTop: "12px", padding: "10px", background: accentColor }}
          >
            {loading ? "Processing..." : isSignUp ? `Create ${userTypeTitle} Account` : `Sign In as ${userTypeTitle}`}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Shared sidebar shell
function AppShell({
  user,
  navItems,
  roleLabel,
  accentColor,
  onLogout,
  children,
}: {
  user: { name: string; role: string };
  navItems: { to: string; label: string; icon: any }[];
  roleLabel: string;
  accentColor: string;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell fade-in">
      <aside className="sidebar">
        <div>
          <h1>Vibhaag</h1>
          <p style={{ color: "#d1c4b6", fontSize: "13px" }}>
            {user.name}
            <span
              style={{
                marginLeft: "8px",
                background: accentColor,
                color: "#fff",
                borderRadius: "6px",
                padding: "1px 7px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "capitalize",
              }}
            >
              {roleLabel}
            </span>
          </p>
        </div>
        <nav className="nav-group">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon size={18} />
              {item.label}
              {item.label === "FFCS" && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: accentColor,
                    color: "#fff",
                    borderRadius: "5px",
                    padding: "1px 6px",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  NEW
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <button className="button secondary" onClick={onLogout} style={{ marginTop: "auto" }} id="logout-btn">
          <LogOut size={16} /> Logout
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    import("./lib/firebase").then(({ auth, db }) => {
      import("firebase/auth").then(({ onAuthStateChanged }) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const { getDoc, doc } = await import("firebase/firestore");
              const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
              if (docSnap.exists()) {
                const data = docSnap.data();
                // Use the role stored in Firestore — DO NOT default to admin
                const role = data.role || "student";
                setUser({ name: data.name || firebaseUser.displayName || "User", role });
              } else {
                // User exists in Firebase Auth but not in Firestore users collection.
                // Check role-specific collections to determine role.
                const { getDoc: gd, doc: d } = await import("firebase/firestore");
                const studentDoc = await gd(d(db, "students", firebaseUser.uid));
                if (studentDoc.exists()) {
                  const data = studentDoc.data();
                  setUser({ name: data.name || "Student", role: "student" });
                } else {
                  const facultyDoc = await gd(d(db, "faculty", firebaseUser.uid));
                  if (facultyDoc.exists()) {
                    const data = facultyDoc.data();
                    setUser({ name: data.name || "Faculty", role: "faculty" });
                  } else {
                    const adminDoc = await gd(d(db, "admins", firebaseUser.uid));
                    if (adminDoc.exists()) {
                      const data = adminDoc.data();
                      setUser({ name: data.name || "Admin", role: "admin" });
                    } else {
                      // Completely new user — default to student (safest)
                      setUser({
                        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                        role: "student",
                      });
                    }
                  }
                }
              }
            } catch {
              // Firestore unavailable — use displayName, default to student
              setUser({
                name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                role: "student",
              });
            }
          } else {
            setUser(null);
          }
          setBooting(false);
        });
        return () => unsubscribe();
      });
    });
  }, []);

  const handleLogout = async () => {
    const { logout } = await import("./lib/api");
    await logout();
    setUser(null);
  };

  const mainContent = useMemo(() => {
    if (booting) {
      return <div className="login-shell" style={{ fontSize: "18px", color: "var(--muted)" }}>⏳ Loading…</div>;
    }

    if (!user) {
      return <AuthScreen onAuthSuccess={(userData) => setUser(userData)} />;
    }

    // ── STUDENT
    if (user.role === "student") {
      return (
        <AppShell
          user={user}
          navItems={studentNavItems}
          roleLabel="Student"
          accentColor={ROLE_COLORS.student}
          onLogout={handleLogout}
        >
          <Routes>
            <Route path="/" element={<StudentHomePage />} />
            <Route path="/schedule" element={<StudentSchedulePage />} />
            <Route path="/attendance" element={<StudentAttendancePage />} />
            <Route path="/announcements" element={<StudentAnnouncementsPage />} />
            <Route path="/leave" element={<StudentLeavePage />} />
            <Route path="/feedback" element={<StudentFeedbackPage />} />
            <Route path="/library" element={<StudentLibraryPage userRole={user.role} userName={user.name} />} />
            <Route path="/ffcs" element={<FfcsStudentPage />} />
          </Routes>
        </AppShell>
      );
    }

    // ── FACULTY
    if (user.role === "faculty") {
      return (
        <AppShell
          user={user}
          navItems={facultyNavItems}
          roleLabel="Faculty"
          accentColor={ROLE_COLORS.faculty}
          onLogout={handleLogout}
        >
          <Routes>
            {/* Faculty overview: re-use admin dashboard read-only */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/ffcs" element={<FfcsFacultyPage />} />
            <Route path="/faculty/leave" element={<FacultyLeavePage />} />
            <Route path="/faculty/classroom" element={<FacultyClassroomPage />} />
            <Route path="/faculty/library" element={<FacultyLibraryPage userRole={user.role} userName={user.name} />} />
            <Route path="/faculty/ai-summarizer" element={<FacultyAISummarizerPage />} />
            <Route path="/faculty/events" element={<FacultyAcademicEventsPage />} />
          </Routes>
        </AppShell>
      );
    }

    // ── ADMIN (default for role === "admin" or anything unrecognized)
    return (
      <AppShell
        user={user}
        navItems={adminNavItems}
        roleLabel="Admin"
        accentColor={ROLE_COLORS.admin}
        onLogout={handleLogout}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/engagement" element={<AdminEngagementPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/library" element={<FacultyLibraryPage userRole={user.role} userName={user.name} />} />
          <Route path="/ffcs" element={<FfcsAdminPage />} />
        </Routes>
      </AppShell>
    );
  }, [booting, user]);

  return <BrowserRouter>{mainContent}</BrowserRouter>;
}
