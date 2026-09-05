import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { verifyPortalLogin } from "../lib/api";

interface StudentLoginPageProps {
  onAuthSuccess: (user: { name: string; role: string }) => void;
}

export default function StudentLoginPage({ onAuthSuccess }: StudentLoginPageProps) {
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const rawInput = enrollmentNumber.trim();
    let cleanEnrollment = rawInput.toUpperCase();
    let generatedEmail = `${rawInput.toLowerCase()}@gmail.com`;

    if (rawInput.includes("@")) {
      generatedEmail = rawInput.toLowerCase();
      cleanEnrollment = rawInput.split("@")[0].toUpperCase();
    }

    try {
      // 1. Firebase Auth with generated/provided email
      await signInWithEmailAndPassword(auth, generatedEmail, password);

      // 2. Backend verification for expectedRole = "student"
      const profile = await verifyPortalLogin("student", cleanEnrollment);

      onAuthSuccess({ name: profile.name, role: "student" });
    } catch (err: unknown) {
      await signOut(auth).catch(() => {});
      localStorage.removeItem("vibhaag-token");

      const msg = err instanceof Error ? err.message : "";
      if (
        msg.includes("auth/user-not-found") ||
        msg.includes("auth/wrong-password") ||
        msg.includes("auth/invalid-credential") ||
        msg.includes("Invalid credentials")
      ) {
        setError("Invalid credentials.");
      } else if (msg.includes("not authorized")) {
        setError("This account is not authorized for Student login.");
      } else if (msg.includes("inactive")) {
        setError("This account is inactive. Contact your administrator.");
      } else if (msg.includes("configured")) {
        setError("This account is not configured for Campus Hub.");
      } else if (msg.includes("Unable to connect") || msg.includes("fetch") || msg.includes("Failed to fetch")) {
        setError("Unable to connect to the server. Please try again.");
      } else {
        setError("Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-screen">
      <section className="admin-login-visual" aria-label="Vibhaag campus and students">
        <div className="campus-artwork"><img src="/loginFirstPage.jpeg" alt="Vibhaag campus and students" /></div>
      </section>
      <section className="admin-login-panel">
        <div className="login-card fade-in reference-login-card">
          <div className="reference-login-heading">
            <h1>Welcome back</h1>
            <p>Vibhaag Student Login</p>
          </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "#fef2f2",
              color: "#dc2626",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="reference-login-form">
          <label className="input">
            <span>
              Enrollment Number
            </span>
            <input
              type="text"
              placeholder="e.g. 23BCS1001"
              value={enrollmentNumber}
              onChange={(e) => setEnrollmentNumber(e.target.value)}
              required
            />
          </label>

          <label className="input">
            <span>
              Password
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="button reference-login-button" disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
      </section>
    </div>
  );
}
