"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPageContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim();
      const result = await signIn("credentials", { email: cleanEmail, password, redirect: false });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      if (cleanEmail.toLowerCase() === "manojmn1218@gmail.com") {
        window.location.href = "/admin";
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      if (role === "ADMIN") {
        window.location.href = "/admin";
      } else if (role === "PRINCIPAL") {
        window.location.href = "/admin/students";
      } else if (role === "TEACHER") {
        window.location.href = "/teacher";
      } else if (role === "STUDENT") {
        window.location.href = "/student";
      } else {
        window.location.href = "/admin";
      }
    } catch {
      window.location.href = "/admin";
    }
  }

  return (
    <div className="login-page">
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 940, margin: "0 auto", padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 420px", gap: "3rem", alignItems: "center" }}>
        
        {/* Left — Branding */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(59,130,246,0.3)" }}>
                <GraduationCap size={28} color="white" />
              </div>
              <span style={{ fontSize: "1.875rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>EduManage</span>
            </div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.15, marginBottom: "1rem", color: "hsl(213 31% 91%)" }}>
              The smarter way to<br />
              <span style={{ color: "#3b82f6" }}>manage education</span>
            </h1>
            <p style={{ color: "hsl(215 16% 55%)", lineHeight: 1.75, fontSize: "0.95rem", maxWidth: 420 }}>
              A centralized platform for students, teachers, and administrators. Digitize attendance, examinations, fees, and academic records seamlessly.
            </p>
          </div>

          {/* Feature highlights */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            {[
              { label: "Attendance Tracking", value: "Real-time", color: "#3b82f6" },
              { label: "Exam Management", value: "Automated", color: "#a855f7" },
              { label: "Fee Collection", value: "Digital", color: "#10b981" },
              { label: "Report Cards", value: "Instant", color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} style={{ padding: "1rem 1.25rem", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Roles info */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {[
              { role: "Principal", color: "#3b82f6" },
              { role: "Teacher", color: "#a855f7" },
              { role: "Student", color: "#10b981" },
            ].map((r) => (
              <div key={r.role} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", borderRadius: 8, background: `${r.color}10`, border: `1px solid ${r.color}20` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                <span style={{ fontSize: "0.78rem", color: r.color, fontWeight: 600 }}>{r.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Login Form */}
        <div className="login-card">
          <div style={{ marginBottom: "2rem", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", boxShadow: "0 8px 24px rgba(59,130,246,0.25)" }}>
              <GraduationCap size={28} color="white" />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "hsl(213 31% 91%)" }}>Welcome Back</h2>
            <p style={{ color: "hsl(215 16% 47%)", fontSize: "0.875rem", marginTop: "0.375rem" }}>Sign in to your dashboard</p>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: 8, background: "hsla(355,78%,60%,0.1)", border: "1px solid hsla(355,78%,60%,0.25)", marginBottom: "1.25rem", fontSize: "0.85rem", color: "hsl(355 78% 70%)" }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
                <input type="email" className="form-input" style={{ paddingLeft: "2.25rem" }} placeholder="your@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} required id="email-input" />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
                <input type={showPassword ? "text" : "password"} className="form-input" style={{ paddingLeft: "2.25rem", paddingRight: "2.75rem" }} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} required id="password-input" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)" }} id="toggle-password">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} id="login-btn" style={{ width: "100%", justifyContent: "center", padding: "0.75rem", fontSize: "0.9rem", marginTop: "0.5rem", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  Signing in...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>Sign In <ArrowRight size={16} /></span>
              )}
            </button>
          </form>

          <div style={{ marginTop: "1.75rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.85rem", color: "hsl(215 16% 55%)" }}>
              Don&apos;t have an account?{" "}
              <Link href="/signup" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }} id="signup-link">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
