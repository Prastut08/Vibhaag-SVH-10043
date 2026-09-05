import React, { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { verifyPortalLogin } from "../lib/api";

interface AdminLoginPageProps {
  onAuthSuccess: (user: { name: string; role: string }) => void;
}

export default function AdminLoginPage({ onAuthSuccess }: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Firebase Auth
      await signInWithEmailAndPassword(auth, email.trim(), password);

      // 2. Backend verification for expectedRole = "admin"
      const profile = await verifyPortalLogin("admin");

      onAuthSuccess({ name: profile.name, role: "admin" });
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
        setError("This account is not authorized for Admin login.");
      } else if (msg.includes("inactive")) {
        setError("This account is inactive. Contact your administrator.");
      } else if (msg.includes("configured")) {
        setError("This account is not configured for Campus Hub.");
      } else if (msg.includes("Unable to connect") || msg.includes("fetch") || msg.includes("Failed to fetch")) {
        setError("Unable to connect to the server. Please try again.");
      } else {
        setError(msg || "Invalid credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card fade-in" style={{ maxWidth: "420px", width: "100%", padding: "32px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", marginBottom: "6px" }}>
            Campus Hub
          </h1>
          <p style={{ fontSize: "16px", fontWeight: "600", color: "#4f46e5" }}>Admin Login</p>
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

        <form onSubmit={handleSubmit}>
          <label className="input" style={{ marginBottom: "16px", display: "block" }}>
            <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "14px" }}>
              Email
            </span>
            <input
              type="email"
              placeholder="e.g. ileshkumar975@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </label>

          <label className="input" style={{ marginBottom: "24px", display: "block" }}>
            <span style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "14px" }}>
              Password
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </label>

          <button
            type="submit"
            className="button"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#4f46e5",
              color: "#ffffff",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
