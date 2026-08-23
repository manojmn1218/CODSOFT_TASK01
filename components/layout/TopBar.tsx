"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Search, Key, X, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

const roleColors: Record<string, string> = {
  ADMIN: "#3b82f6",
  TEACHER: "#a855f7",
  STUDENT: "#10b981",
};

const roleGradients: Record<string, string> = {
  ADMIN: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
  TEACHER: "linear-gradient(135deg, #a855f7, #ec4899)",
  STUDENT: "linear-gradient(135deg, #10b981, #06b6d4)",
};

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role || "";
  const accentColor = roleColors[role] || "#3b82f6";
  const gradient = roleGradients[role] || "linear-gradient(135deg, #3b82f6, #8b5cf6)";
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: "error", message: "New password must be at least 6 characters." });
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: "New passwords do not match." });
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/students/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordFeedback({ type: "success", message: "Password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordFeedback(null);
        }, 1500);
      } else {
        setPasswordFeedback({ type: "error", message: data.error || "Failed to update password." });
      }
    } catch {
      setPasswordFeedback({ type: "error", message: "Network error. Please try again." });
    }
    setPasswordSaving(false);
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1 style={{ fontWeight: 700, fontSize: "1.125rem", color: "hsl(213 31% 91%)" }}>{title}</h1>
          {subtitle && <p style={{ fontSize: "0.78rem", color: "hsl(215 16% 47%)", marginTop: 2 }}>{subtitle}</p>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div className="search-box" style={{ display: "flex" }}>
            <Search size={15} color="hsl(215 16% 47%)" />
            <input type="text" placeholder="Search..." id="topbar-search" />
          </div>

          <button id="notification-btn" style={{ position: "relative", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "0.5rem", cursor: "pointer", color: "hsl(215 16% 60%)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "hsl(213 31% 91%)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "hsl(215 16% 60%)"; }}>
            <Bell size={18} />
            <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: accentColor, border: "1.5px solid hsl(222 47% 7%)" }} />
          </button>

          {/* Change Password Trigger Button */}
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPasswordFeedback(null);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              cursor: "pointer",
              color: "hsl(213 31% 85%)",
              fontSize: "0.78rem",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${accentColor}18`; e.currentTarget.style.borderColor = `${accentColor}40`; e.currentTarget.style.color = accentColor; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "hsl(213 31% 85%)"; }}
            id="change-password-topbar-btn"
            title="Change your login password"
          >
            <Key size={14} color={accentColor} />
            <span>Password</span>
          </button>

          {/* Profile pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.375rem 0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(213 31% 88%)" }}>{greeting}, {session?.user?.name?.split(" ")[0]}</div>
              {(session?.user as any)?.schoolName ? (
                <div style={{ fontSize: "0.68rem", color: "#93c5fd", fontWeight: 600, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={(session?.user as any).schoolName}>
                  🏛️ {(session?.user as any).schoolName}
                </div>
              ) : (
                <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 50%)" }}>Major Admin</div>
              )}
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", color: "white", border: `1.5px solid ${accentColor}40` }}>
              {session?.user?.name?.[0] || "?"}
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPasswordModal(false)}>
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accentColor}18`, border: `1px solid ${accentColor}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lock size={18} color={accentColor} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Change Password</h3>
                  <p style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>Update your personal login password</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)", padding: 4 }}><X size={20} /></button>
            </div>

            {passwordFeedback && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: 8, background: passwordFeedback.type === "success" ? "rgba(16,185,129,0.1)" : "hsla(355,78%,60%,0.1)", border: `1px solid ${passwordFeedback.type === "success" ? "rgba(16,185,129,0.3)" : "hsla(355,78%,60%,0.25)"}`, marginBottom: "1.25rem", fontSize: "0.85rem", color: passwordFeedback.type === "success" ? "#10b981" : "hsl(355 78% 70%)" }}>
                {passwordFeedback.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="form-label">Current Password *</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
                  <input
                    type={showPasswordText ? "text" : "password"}
                    className="form-input"
                    style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
                    placeholder="Enter current password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    id="current-password-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">New Password *</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
                  <input
                    type={showPasswordText ? "text" : "password"}
                    className="form-input"
                    style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
                    placeholder="Min 6 characters"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    id="new-password-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Confirm New Password *</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
                  <input
                    type={showPasswordText ? "text" : "password"}
                    className="form-input"
                    style={{ paddingLeft: "2.25rem", paddingRight: "2.5rem" }}
                    placeholder="Re-enter new password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    id="confirm-new-password-input"
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button type="button" onClick={() => setShowPasswordText(!showPasswordText)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 50%)", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", padding: 0 }} id="toggle-password-view">
                  {showPasswordText ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showPasswordText ? "Hide passwords" : "Show passwords"}
                </button>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center", background: gradient }} disabled={passwordSaving} id="save-password-btn">
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
