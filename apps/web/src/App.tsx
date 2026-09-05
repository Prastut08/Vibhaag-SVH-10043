import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { BarChart3, CalendarDays, Layers, LogOut, Megaphone, ShieldCheck, Users } from "lucide-react";

import { bootstrapAdmin, fetchAuthStatus, fetchMe, login, logout } from "./lib/api";
import AdminEngagementPage from "./pages/AdminEngagementPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AttendancePage from "./pages/AttendancePage";
import DashboardPage from "./pages/DashboardPage";
import PeoplePage from "./pages/PeoplePage";
import SessionsPage from "./pages/SessionsPage";
import StudentAnnouncementsPage from "./pages/StudentAnnouncementsPage";
import StudentAttendancePage from "./pages/StudentAttendancePage";
import StudentFeedbackPage from "./pages/StudentFeedbackPage";
import StudentHomePage from "./pages/StudentHomePage";
import StudentLeavePage from "./pages/StudentLeavePage";
import StudentSchedulePage from "./pages/StudentSchedulePage";

const navItems = [
  { to: "/", label: "Overview", icon: BarChart3 },
  { to: "/attendance", label: "Attendance", icon: ShieldCheck },
  { to: "/sessions", label: "Timetable", icon: CalendarDays },
  { to: "/people", label: "People", icon: Users },
  { to: "/engagement", label: "Engagement", icon: Megaphone },
  { to: "/analytics", label: "Analytics", icon: Layers },
];

const studentNavItems = [
  { to: "/", label: "My Hub", icon: BarChart3 },
  { to: "/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/attendance", label: "My Attendance", icon: ShieldCheck },
  { to: "/announcements", label: "Announcements", icon: Layers },
  { to: "/leave", label: "Leave Requests", icon: Users },
  { to: "/feedback", label: "Session Feedback", icon: BarChart3 },
];

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
        onAuthSuccess(user);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const { loginWithGoogleRoleBased } = await import("./lib/api");
      const user = await loginWithGoogleRoleBased(userType);
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err?.message || "Google Sign-In failed");
    } finally {
      setLoading(false);
    }
  }

  const userTypeTitle = userType === "student" ? "Student" : userType === "faculty" ? "Faculty" : "Admin";

  return (
    <div className="login-shell">
      <div className="login-card fade-in" style={{ maxWidth: "480px", width: "100%" }}>
        {/* 3 Portal Sections Selector */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", background: "#e5e7eb", padding: "4px", borderRadius: "10px" }}>
          <button
            type="button"
            className="button"
            style={{
              flex: 1,
              padding: "8px 4px",
              fontSize: "13px",
              fontWeight: 600,
              background: userType === "student" ? "#2563eb" : "transparent",
              color: userType === "student" ? "#ffffff" : "#374151",
            }}
            onClick={() => { setUserType("student"); setError(null); }}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className="button"
            style={{
              flex: 1,
              padding: "8px 4px",
              fontSize: "13px",
              fontWeight: 600,
              background: userType === "faculty" ? "#4f46e5" : "transparent",
              color: userType === "faculty" ? "#ffffff" : "#374151",
            }}
            onClick={() => { setUserType("faculty"); setError(null); }}
          >
            👨‍🏫 Faculty
          </button>
          <button
            type="button"
            className="button"
            style={{
              flex: 1,
              padding: "8px 4px",
              fontSize: "13px",
              fontWeight: 600,
              background: userType === "admin" ? "#059669" : "transparent",
              color: userType === "admin" ? "#ffffff" : "#374151",
            }}
            onClick={() => { setUserType("admin"); setError(null); }}
          >
            🛠️ Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px", textAlign: "center" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>
              {userTypeTitle} {isSignUp ? "Registration" : "Portal Login"}
            </h2>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              {isSignUp ? `Create a new ${userTypeTitle} account in Firestore` : `Sign in to access the ${userTypeTitle} dashboard`}
            </p>
          </div>

          {/* Toggle between Sign In and Sign Up */}
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <div className="notice">{error}</div> : null}

          <button className="button" type="submit" disabled={loading} style={{ width: "100%", marginTop: "12px", padding: "10px" }}>
            {loading ? "Processing..." : isSignUp ? `Create ${userTypeTitle} Account` : `Sign In as ${userTypeTitle}`}
          </button>

          <button
            className="button secondary"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{ marginTop: "10px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px" }}
          >
            🔍 Sign in with Google ({userTypeTitle})
          </button>
        </form>
      </div>
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
            import("firebase/firestore").then(({ getDoc, doc }) => {
              getDoc(doc(db, "users", firebaseUser.uid)).then((docSnap) => {
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  setUser({ name: data.name || firebaseUser.displayName || "User", role: data.role || "admin" });
                } else {
                  setUser({
                    name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                    role: "admin",
                  });
                }
                setBooting(false);
              }).catch(() => {
                setUser({ name: firebaseUser.displayName || "User", role: "admin" });
                setBooting(false);
              });
            });
          } else {
            setUser(null);
            setBooting(false);
          }
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
      return <div className="login-shell">Loading...</div>;
    }
    if (!user) {
      return <AuthScreen onAuthSuccess={(userData) => setUser(userData)} />;
    }
    if (user.role === "student") {
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
                  className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
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
              <Route path="/" element={<StudentHomePage />} />
              <Route path="/schedule" element={<StudentSchedulePage />} />
              <Route path="/attendance" element={<StudentAttendancePage />} />
              <Route path="/announcements" element={<StudentAnnouncementsPage />} />
              <Route path="/leave" element={<StudentLeavePage />} />
              <Route path="/feedback" element={<StudentFeedbackPage />} />
            </Routes>
          </main>
        </div>
      );
    }
    return (
      <div className="app-shell fade-in">
        <aside className="sidebar">
          <div>
            <h1>Vibhaag</h1>
            <p>{user.name} (Admin)</p>
          </div>
          <nav className="nav-group">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
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
            <Route path="/" element={<DashboardPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/engagement" element={<AdminEngagementPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </main>
      </div>
    );
  }, [booting, user]);

  return <BrowserRouter>{mainContent}</BrowserRouter>;
}
