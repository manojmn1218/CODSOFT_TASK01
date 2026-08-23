"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/layout/TopBar";
import { Users, Plus, Search, Trash2, Key, X, GraduationCap, CheckCircle, AlertCircle, School } from "lucide-react";
import { format } from "date-fns";

interface Student {
  id: string;
  rollNumber: string;
  gender: string;
  dob: string | null;
  parentName: string | null;
  parentPhone: string | null;
  address: string | null;
  admissionDate: string;
  user: { name: string; email: string; phone: string | null };
  class: { name: string; section: string } | null;
}

interface Class {
  id: string;
  name: string;
  section: string;
}

export default function StudentsPage() {
  const { data: session } = useSession();
  const userSchool = (session?.user as any)?.schoolName;

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Add Student Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    classId: "",
    gender: "MALE",
    dob: "",
    parentName: "",
    parentPhone: "",
    address: "",
  });

  // Password Modal (Admin controls student password)
  const [passwordModalStudent, setPasswordModalStudent] = useState<Student | null>(null);
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then(r => r.json()),
      fetch("/api/classes").then(r => r.json()),
    ]).then(([s, c]) => {
      setStudents(Array.isArray(s) ? s : []);
      setClasses(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, []);

  const filtered = students.filter(s =>
    s.user.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.user.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setAddError("");

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      const refreshed = await fetch("/api/students").then(r => r.json());
      setStudents(Array.isArray(refreshed) ? refreshed : []);
      setShowModal(false);
      setForm({ name: "", email: "", rollNumber: "", classId: "", gender: "MALE", dob: "", parentName: "", parentPhone: "", address: "" });
    } else {
      setAddError(data.error || "Failed to add student.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await fetch(`/api/students?id=${id}`, { method: "DELETE" });
    setStudents(prev => prev.filter(s => s.id !== id));
  }

  async function handleAdminChangePassword(resetToDefault = false) {
    if (!passwordModalStudent) return;
    setPasswordSaving(true);
    setPasswordMessage(null);

    const res = await fetch("/api/students/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: passwordModalStudent.id,
        newPassword: resetToDefault ? "student123" : newStudentPassword,
        resetToDefault,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setPasswordMessage({ type: "success", text: data.message || "Password updated successfully!" });
      setNewStudentPassword("");
      setTimeout(() => {
        if (passwordModalStudent) {
          setPasswordModalStudent(null);
          setPasswordMessage(null);
        }
      }, 1500);
    } else {
      setPasswordMessage({ type: "error", text: data.error || "Failed to update password." });
    }
    setPasswordSaving(false);
  }

  const genderBadge = (g: string) => g === "MALE" ? "badge-primary" : "badge-accent";

  return (
    <div>
      <TopBar title="Students" subtitle={`${students.length} students enrolled`} />
      <div className="page-container">
        {userSchool && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))",
              border: "1px solid rgba(59,130,246,0.25)",
              borderRadius: "0.75rem",
              padding: "0.875rem 1.25rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <School size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 55%)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Enrolled Campus
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "hsl(213 31% 95%)" }}>
                {userSchool}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Student Management</h2>
            <p className="section-subtitle">View, add, and manage student accounts and passwords</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setAddError(""); }} id="add-student-btn">
            <Plus size={16} /> Add Student
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="search-box">
            <Search size={15} color="hsl(215 16% 47%)" />
            <input type="text" placeholder="Search by name, roll, or email..." value={search} onChange={e => setSearch(e.target.value)} id="student-search" />
          </div>
          <span style={{ fontSize: "0.8rem", color: "hsl(215 16% 47%)" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: "0.75rem", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>
              <div style={{ width: 32, height: 32, border: "3px solid hsl(var(--border))", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
              Loading students...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Parent</th>
                  <th>Admitted</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "hsl(215 16% 47%)" }}><Users size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.4 }} />No students found</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="avatar" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>{s.user.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.user.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>{s.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{s.rollNumber}</span></td>
                    <td>{s.class ? `${s.class.name} - ${s.class.section}` : <span style={{ color: "hsl(215 16% 40%)" }}>—</span>}</td>
                    <td><span className={`badge ${genderBadge(s.gender)}`}>{s.gender}</span></td>
                    <td>
                      <div style={{ fontSize: "0.8rem" }}>{s.parentName || "—"}</div>
                      <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 47%)" }}>{s.parentPhone || ""}</div>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>{format(new Date(s.admissionDate), "MMM d, yyyy")}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.375rem 0.625rem", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.3)", background: "rgba(245, 158, 11, 0.08)" }}
                          onClick={() => {
                            setPasswordModalStudent(s);
                            setNewStudentPassword("");
                            setPasswordMessage(null);
                          }}
                          title="Change or Reset Student Password"
                          id={`change-pw-student-${s.id}`}
                        >
                          <Key size={14} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: "0.375rem 0.625rem" }} onClick={() => handleDelete(s.id, s.user.name)} id={`delete-student-${s.id}`} title="Delete student"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Student Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-content">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={18} color="#3b82f6" /></div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Add New Student</h3>
                    <p style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>Default login password will be set to <strong style={{ color: "#3b82f6" }}>student123</strong></p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)", padding: 4 }} id="close-modal"><X size={20} /></button>
              </div>

              {addError && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: 8, background: "hsla(355,78%,60%,0.1)", border: "1px solid hsla(355,78%,60%,0.25)", marginBottom: "1rem", fontSize: "0.85rem", color: "hsl(355 78% 70%)" }}>
                  <AlertCircle size={16} />
                  <span>{addError}</span>
                </div>
              )}

              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label className="form-label">Full Name *</label><input className="form-input" placeholder="Aarav Sharma" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div><label className="form-label">Email *</label><input type="email" className="form-input" placeholder="aarav.sharma@student.edumanage.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                  <div><label className="form-label">Roll Number *</label><input className="form-input" placeholder="STU202411" required value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} /></div>
                  <div>
                    <label className="form-label">Class</label>
                    <select className="form-select" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
                      <option value="">— Select Class —</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} /></div>
                  <div><label className="form-label">Parent / Guardian Name</label><input className="form-input" placeholder="Rajesh Sharma" value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} /></div>
                  <div><label className="form-label">Parent Phone</label><input className="form-input" placeholder="+91-98451-10001" value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} /></div>
                </div>
                <div><label className="form-label">Address</label><input className="form-input" placeholder="42, Shanti Nagar, Bengaluru" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>

                <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", fontSize: "0.8rem", color: "hsl(215 16% 65%)" }}>
                  🔑 <strong>Initial Credentials:</strong> Student will sign in with email and default password <span style={{ color: "#3b82f6", fontWeight: 700 }}>student123</span>. They can change it after login.
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving} id="save-student-btn">
                    {saving ? "Saving..." : "Add Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin Password Management Modal */}
        {passwordModalStudent && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPasswordModalStudent(null)}>
            <div className="modal-content" style={{ maxWidth: 440 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Key size={18} color="#f59e0b" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Manage Password</h3>
                    <p style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>{passwordModalStudent.user.name} ({passwordModalStudent.rollNumber})</p>
                  </div>
                </div>
                <button onClick={() => setPasswordModalStudent(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)", padding: 4 }}><X size={20} /></button>
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
                    value={newStudentPassword}
                    onChange={e => setNewStudentPassword(e.target.value)}
                    id="admin-new-password-input"
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={passwordSaving || newStudentPassword.length < 6}
                    onClick={() => handleAdminChangePassword(false)}
                    id="admin-save-password-btn"
                  >
                    {passwordSaving ? "Updating..." : "Set New Password"}
                  </button>
                </div>

                <div style={{ position: "relative", textAlign: "center", margin: "0.5rem 0" }}>
                  <div style={{ borderTop: "1px solid hsl(216 34% 17%)", position: "absolute", top: "50%", width: "100%" }} />
                  <span style={{ position: "relative", background: "hsl(222 47% 10%)", padding: "0 0.5rem", fontSize: "0.72rem", color: "hsl(215 16% 47%)" }}>OR</span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: "center", borderColor: "rgba(245, 158, 11, 0.3)", color: "#f59e0b" }}
                  disabled={passwordSaving}
                  onClick={() => handleAdminChangePassword(true)}
                  id="admin-reset-default-btn"
                >
                  ⚡ Reset to Default (student123)
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
