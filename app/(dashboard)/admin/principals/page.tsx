"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { ShieldCheck, Plus, Search, Trash2, Key, X, GraduationCap, Building2, Users, UserCheck, CheckCircle, AlertCircle, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

interface Principal {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  createdAt: string;
}

interface Stats {
  totalPrincipals: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
}

export default function PrincipalsPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string })?.id;

  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPrincipals: 0, totalStudents: 0, totalTeachers: 0, totalClasses: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Add Principal Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "principal123",
  });

  // Manage Password Modal
  const [passwordModalPrincipal, setPasswordModalPrincipal] = useState<Principal | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPrincipals();
  }, []);

  async function fetchPrincipals() {
    try {
      const res = await fetch("/api/principals");
      if (res.ok) {
        const data = await res.json();
        setPrincipals(data.principals || []);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const filtered = principals.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search))
  );

  async function handleAddPrincipal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setAddError("");

    const res = await fetch("/api/principals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      await fetchPrincipals();
      setShowAddModal(false);
      setForm({ name: "", email: "", phone: "", password: "principal123" });
    } else {
      setAddError(data.error || "Failed to add principal.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove Principal ${name}?`)) return;
    const res = await fetch(`/api/principals?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setPrincipals(prev => prev.filter(p => p.id !== id));
      setStats(prev => ({ ...prev, totalPrincipals: Math.max(0, prev.totalPrincipals - 1) }));
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete principal.");
    }
  }

  async function handleAdminPasswordChange(resetToDefault = false) {
    if (!passwordModalPrincipal) return;
    setPasswordSaving(true);
    setPasswordMessage(null);

    const targetPassword = resetToDefault ? "principal123" : newPassword;

    const res = await fetch("/api/principals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: passwordModalPrincipal.id,
        password: targetPassword,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setPasswordMessage({
        type: "success",
        text: resetToDefault
          ? `Password reset to default (principal123) for ${passwordModalPrincipal.name}`
          : `Password updated successfully for ${passwordModalPrincipal.name}`,
      });
      setNewPassword("");
      setTimeout(() => {
        if (passwordModalPrincipal) {
          setPasswordModalPrincipal(null);
          setPasswordMessage(null);
        }
      }, 1500);
    } else {
      setPasswordMessage({ type: "error", text: data.error || "Failed to update password." });
    }
    setPasswordSaving(false);
  }

  return (
    <div>
      <TopBar title="Principals & Campus Leadership" subtitle="Manage and oversee institutional principals across all campuses" />
      <div className="page-container">
        
        {/* Metric Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Principals", value: stats.totalPrincipals, icon: ShieldCheck, color: "#3b82f6", sub: "Appointed leaders" },
            { label: "Managed Students", value: stats.totalStudents, icon: Users, color: "#10b981", sub: "Across all branches" },
            { label: "Faculty Staff", value: stats.totalTeachers, icon: UserCheck, color: "#a855f7", sub: "Teaching staff" },
            { label: "Active Classes", value: stats.totalClasses, icon: Building2, color: "#f59e0b", sub: "Academic sections" },
          ].map(card => (
            <div key={card.label} className="stat-card" style={{ borderColor: `${card.color}20` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem", border: `1px solid ${card.color}25` }}>
                <card.icon size={20} color={card.color} />
              </div>
              <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "hsl(213 31% 91%)", lineHeight: 1 }}>{loading ? "—" : card.value}</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)", marginTop: "0.25rem" }}>{card.label}</div>
              <div style={{ fontSize: "0.7rem", color: `${card.color}aa`, marginTop: "0.25rem" }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Principals Directory</h2>
            <p className="section-subtitle">Multi-principal access, credential control, and campus leadership</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowAddModal(true); setAddError(""); }} id="add-principal-btn">
            <Plus size={16} /> Appoint Principal
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="search-box">
            <Search size={15} color="hsl(215 16% 47%)" />
            <input type="text" placeholder="Search by principal name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} id="principal-search" />
          </div>
          <span style={{ fontSize: "0.8rem", color: "hsl(215 16% 47%)" }}>{filtered.length} principal{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Principals Table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: "0.75rem", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>
              <div style={{ width: 32, height: 32, border: "3px solid hsl(var(--border))", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
              Loading principals...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Principal</th>
                  <th>Contact Info</th>
                  <th>Role Designation</th>
                  <th>Appointed Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "hsl(215 16% 47%)" }}>
                      <ShieldCheck size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.4 }} />
                      No principals found
                    </td>
                  </tr>
                ) : filtered.map(p => {
                  const isCurrent = p.id === currentUserId;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div className="avatar" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>
                            {p.name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span>{p.name}</span>
                              {isCurrent && <span className="badge badge-primary" style={{ fontSize: "0.6rem" }}>You</span>}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>Principal / Campus Head</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <Mail size={12} color="hsl(215 16% 50%)" />
                          <span>{p.email}</span>
                        </div>
                        {p.phone && (
                          <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 47%)", display: "flex", alignItems: "center", gap: "0.375rem", marginTop: 2 }}>
                            <Phone size={12} color="hsl(215 16% 50%)" />
                            <span>{p.phone}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-accent">
                          Principal Administrator
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>
                        {format(new Date(p.createdAt), "MMM d, yyyy")}
                      </td>
                      <td>
                        <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                          Active
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "0.375rem 0.625rem", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.3)", background: "rgba(245, 158, 11, 0.08)" }}
                            onClick={() => {
                              setPasswordModalPrincipal(p);
                              setNewPassword("");
                              setPasswordMessage(null);
                            }}
                            title="Manage / Reset Principal Password"
                            id={`manage-pw-principal-${p.id}`}
                          >
                            <Key size={14} />
                          </button>
                          {!isCurrent && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: "0.375rem 0.625rem" }}
                              onClick={() => handleDelete(p.id, p.name)}
                              id={`delete-principal-${p.id}`}
                              title="Remove Principal"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Principal Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
            <div className="modal-content" style={{ maxWidth: 460 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShieldCheck size={18} color="#3b82f6" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Appoint New Principal</h3>
                    <p style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>Grant institutional leadership and full administrative access</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)", padding: 4 }}><X size={20} /></button>
              </div>

              {addError && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: 8, background: "hsla(355,78%,60%,0.1)", border: "1px solid hsla(355,78%,60%,0.25)", marginBottom: "1rem", fontSize: "0.85rem", color: "hsl(355 78% 70%)" }}>
                  <AlertCircle size={16} />
                  <span>{addError}</span>
                </div>
              )}

              <form onSubmit={handleAddPrincipal} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="Dr. Arthur Davies" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} id="principal-name-input" />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" placeholder="arthur.davies@edumanage.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} id="principal-email-input" />
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-input" placeholder="+1-555-0199" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} id="principal-phone-input" />
                </div>

                <div>
                  <label className="form-label">Initial Password</label>
                  <input className="form-input" placeholder="principal123" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} id="principal-password-input" />
                  <p style={{ fontSize: "0.72rem", color: "hsl(215 16% 47%)", marginTop: 4 }}>Default is <strong>principal123</strong>. Can be changed after signing in.</p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving} id="save-principal-btn">
                    {saving ? "Appointing..." : "Appoint Principal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change / Reset Principal Password Modal */}
        {passwordModalPrincipal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPasswordModalPrincipal(null)}>
            <div className="modal-content" style={{ maxWidth: 440 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Key size={18} color="#f59e0b" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Manage Principal Password</h3>
                    <p style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>{passwordModalPrincipal.name} ({passwordModalPrincipal.email})</p>
                  </div>
                </div>
                <button onClick={() => setPasswordModalPrincipal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)", padding: 4 }}><X size={20} /></button>
              </div>

              {passwordMessage && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: 8, background: passwordMessage.type === "success" ? "rgba(16,185,129,0.1)" : "hsla(355,78%,60%,0.1)", border: `1px solid ${passwordMessage.type === "success" ? "rgba(16,185,129,0.3)" : "hsla(355,78%,60%,0.25)"}`, marginBottom: "1rem", fontSize: "0.85rem", color: passwordMessage.type === "success" ? "#10b981" : "hsl(355 78% 70%)" }}>
                  {passwordMessage.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Set Custom Password</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    id="principal-new-pw-input"
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ justifyContent: "center" }}
                  disabled={passwordSaving || newPassword.length < 6}
                  onClick={() => handleAdminPasswordChange(false)}
                  id="save-principal-pw-btn"
                >
                  {passwordSaving ? "Updating..." : "Set New Password"}
                </button>

                <div style={{ position: "relative", textAlign: "center", margin: "0.5rem 0" }}>
                  <div style={{ borderTop: "1px solid hsl(216 34% 17%)", position: "absolute", top: "50%", width: "100%" }} />
                  <span style={{ position: "relative", background: "hsl(222 47% 10%)", padding: "0 0.5rem", fontSize: "0.72rem", color: "hsl(215 16% 47%)" }}>OR</span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: "center", borderColor: "rgba(245, 158, 11, 0.3)", color: "#f59e0b" }}
                  disabled={passwordSaving}
                  onClick={() => handleAdminPasswordChange(true)}
                  id="reset-principal-default-pw-btn"
                >
                  ⚡ Reset to Default (principal123)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
