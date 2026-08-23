"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, Phone, AlertCircle, CheckCircle, ArrowRight, Shield, BookOpen, Users } from "lucide-react";

const ROLES = [
  { value: "STUDENT", label: "Student", description: "Access grades, attendance & fees", icon: BookOpen, color: "#10b981" },
  { value: "TEACHER", label: "Teacher", description: "Manage classes & exam results", icon: Users, color: "#a855f7" },
  { value: "ADMIN", label: "Principal", description: "Full school administration & leadership", icon: Shield, color: "#3b82f6" },
];

export default function SignupPageContent() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "STUDENT", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function updateForm(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setError("");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Auto sign-in after signup
      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Account created but auto-login failed — redirect to login
        setTimeout(() => router.push("/login"), 1500);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      setTimeout(() => {
        if (form.email.toLowerCase() === "manojmn1218@gmail.com" || role === "ADMIN") {
          window.location.href = "/admin";
        } else if (role === "PRINCIPAL") {
          window.location.href = "/admin/students";
        } else if (role === "TEACHER") {
          window.location.href = "/teacher";
        } else {
          window.location.href = "/student";
        }
      }, 1000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const selectedRole = ROLES.find(r => r.value === form.role)!;

  if (success) {
    return (
      <div className="login-page">
        <div style={{ textAlign: "center", maxWidth: 420, margin: "0 auto", padding: "2rem" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <CheckCircle size={36} color="#10b981" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "hsl(213 31% 91%)", marginBottom: "0.5rem" }}>Account Created!</h2>
          <p style={{ color: "hsl(215 16% 55%)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Welcome aboard! Redirecting you to your dashboard...
          </p>
          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ width: 32, height: 32, border: "3px solid rgba(16,185,129,0.3)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 940, margin: "0 auto", padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 460px", gap: "3rem", alignItems: "center" }}>
        
        {/* Left — Branding */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(59,130,246,0.3)" }}>
                <GraduationCap size={28} color="white" />
              </div>
              <span style={{ fontSize: "1.875rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>EduManage</span>
            </div>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, lineHeight: 1.15, marginBottom: "1rem", color: "hsl(213 31% 91%)" }}>
              Join the platform<br />
              <span style={{ color: "#3b82f6" }}>built for education</span>
            </h1>
            <p style={{ color: "hsl(215 16% 55%)", lineHeight: 1.75, fontSize: "0.95rem", maxWidth: 400 }}>
              Create your account to access attendance, grades, examinations, and everything you need in one place.
            </p>
          </div>

          {/* Role selector cards */}
          <div>
            <p style={{ fontSize: "0.7rem", color: "hsl(215 16% 45%)", marginBottom: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Select your role</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {ROLES.map((role) => {
                const isSelected = form.role === role.value;
                return (
                  <button key={role.value} onClick={() => updateForm("role", role.value)} type="button"
                    style={{
                      display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1.125rem", borderRadius: 10,
                      background: isSelected ? `${role.color}12` : "rgba(255,255,255,0.03)",
                      border: `1.5px solid ${isSelected ? `${role.color}60` : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s", width: "100%",
                      boxShadow: isSelected ? `0 0 0 1px ${role.color}20, 0 4px 12px ${role.color}10` : "none",
                    }}
                    id={`role-${role.value.toLowerCase()}`}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: isSelected ? `${role.color}20` : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isSelected ? `${role.color}40` : "rgba(255,255,255,0.1)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <role.icon size={18} color={isSelected ? role.color : "hsl(215 16% 47%)"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: isSelected ? role.color : "hsl(213 31% 85%)" }}>{role.label}</div>
                      <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 47%)" }}>{role.description}</div>
                    </div>
                    {isSelected && (
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: role.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckCircle size={12} color="white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — Signup Form */}
        <div className="login-card">
          <div style={{ marginBottom: "1.75rem", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${selectedRole.color}, #8b5cf6)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", boxShadow: `0 8px 24px ${selectedRole.color}40`, transition: "all 0.3s" }}>
              <selectedRole.icon size={26} color="white" />
            </div>
            <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "hsl(213 31% 91%)" }}>Create Account</h2>
            <p style={{ color: "hsl(215 16% 47%)", fontSize: "0.85rem", marginTop: "0.375rem" }}>
              Sign up as <span style={{ color: selectedRole.color, fontWeight: 600 }}>{selectedRole.label}</span>
            </p>
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: 8, background: "hsla(355,78%,60%,0.1)", border: "1px solid hsla(355,78%,60%,0.25)", marginBottom: "1.25rem", fontSize: "0.85rem", color: "hsl(355 78% 70%)" }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="form-label">Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
                <input type="text" className="form-input" style={{ paddingLeft: "2.25rem" }} placeholder="John Doe" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required id="name-input" />
              </div>
            </div>

            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
                <input type="email" className="form-input" style={{ paddingLeft: "2.25rem" }} placeholder="john@email.com" value={form.email} onChange={(e) => updateForm("email", e.target.value)} required id="signup-email-input" />
              </div>
            </div>

            <div>
              <label className="form-label">Phone <span style={{ color: "hsl(215 16% 40%)", fontWeight: 400 }}>(optional)</span></label>
              <div style={{ position: "relative" }}>
                <Phone size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
                <input type="tel" className="form-input" style={{ paddingLeft: "2.25rem" }} placeholder="+91-XXXXX-XXXXX" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} id="phone-input" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="form-label">Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
                  <input type={showPassword ? "text" : "password"} className="form-input" style={{ paddingLeft: "2.25rem" }} placeholder="Min 6 chars" value={form.password} onChange={(e) => updateForm("password", e.target.value)} required id="signup-password-input" />
                </div>
              </div>
              <div>
                <label className="form-label">Confirm</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
                  <input type={showPassword ? "text" : "password"} className="form-input" style={{ paddingLeft: "2.25rem" }} placeholder="Re-enter" value={form.confirmPassword} onChange={(e) => updateForm("confirmPassword", e.target.value)} required id="confirm-password-input" />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 50%)", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", padding: 0 }} id="toggle-password-signup">
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                {showPassword ? "Hide" : "Show"} passwords
              </button>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} id="signup-btn" style={{ width: "100%", justifyContent: "center", padding: "0.75rem", fontSize: "0.9rem", marginTop: "0.25rem", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer", background: `linear-gradient(135deg, ${selectedRole.color}, #8b5cf6)`, transition: "all 0.3s" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  Creating account...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>Create Account <ArrowRight size={16} /></span>
              )}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.85rem", color: "hsl(215 16% 55%)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#3b82f6", fontWeight: 600, textDecoration: "none" }} id="login-link">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
