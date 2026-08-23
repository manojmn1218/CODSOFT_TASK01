"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/layout/TopBar";
import { UserCheck, Plus, Search, Trash2, X, School } from "lucide-react";
import { format } from "date-fns";

interface Teacher {
  id: string;
  employeeId: string;
  qualification: string | null;
  department: string | null;
  joiningDate: string;
  user: { name: string; email: string; phone: string | null };
  classes: { name: string; section: string }[];
  subjects: { name: string }[];
}

export default function TeachersPage() {
  const { data: session } = useSession();
  const userSchool = (session?.user as any)?.schoolName;

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", employeeId: "", qualification: "", department: "" });

  useEffect(() => {
    fetch("/api/teachers").then(r => r.json()).then(d => { setTeachers(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = teachers.filter(t =>
    t.user.name.toLowerCase().includes(search.toLowerCase()) ||
    t.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    (t.department || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/teachers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      const refreshed = await fetch("/api/teachers").then(r => r.json());
      setTeachers(Array.isArray(refreshed) ? refreshed : []);
      setShowModal(false);
      setForm({ name: "", email: "", employeeId: "", qualification: "", department: "" });
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name} from the system?`)) return;
    await fetch(`/api/teachers?id=${id}`, { method: "DELETE" });
    setTeachers(prev => prev.filter(t => t.id !== id));
  }

  const deptColors: Record<string, string> = {
    "Mathematics": "#3b82f6", "Science": "#10b981", "English": "#a855f7",
    "Physics": "#f59e0b", "Chemistry": "#ef4444", "History": "#06b6d4",
  };

  return (
    <div>
      <TopBar title="Teachers" subtitle={`${teachers.length} teaching staff`} />
      <div className="page-container">
        {userSchool && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.08))",
              border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: "0.75rem",
              padding: "0.875rem 1.25rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <School size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 55%)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Faculty Campus
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "hsl(213 31% 95%)" }}>
                {userSchool}
              </div>
            </div>
          </div>
        )}

        <div className="section-header">
          <div>
            <h2 className="section-title">Teacher Management</h2>
            <p className="section-subtitle">Manage teaching staff and their assignments</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-teacher-btn">
            <Plus size={16} /> Add Teacher
          </button>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div className="search-box">
            <Search size={15} color="hsl(215 16% 47%)" />
            <input type="text" placeholder="Search by name, ID, or department..." value={search} onChange={e => setSearch(e.target.value)} id="teacher-search" />
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: "0.75rem", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>
              <div style={{ width: 32, height: 32, border: "3px solid hsl(var(--border))", borderTopColor: "#a855f7", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
              Loading teachers...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Qualification</th>
                  <th>Classes</th>
                  <th>Joined</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "hsl(215 16% 47%)" }}><UserCheck size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.4 }} />No teachers found</td></tr>
                ) : filtered.map(t => {
                  const deptColor = deptColors[t.department || ""] || "#6b7280";
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div className="avatar" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.25)" }}>{t.user.name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{t.user.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>{t.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-accent">{t.employeeId}</span></td>
                      <td>
                        {t.department && (
                          <span className="badge" style={{ background: `${deptColor}18`, color: deptColor, border: `1px solid ${deptColor}30` }}>{t.department}</span>
                        )}
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 65%)" }}>{t.qualification || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                          {t.classes.slice(0, 3).map(c => (
                            <span key={c.name + c.section} style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: 4, color: "hsl(215 16% 65%)" }}>{c.name} {c.section}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>{format(new Date(t.joiningDate), "MMM yyyy")}</td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn btn-danger" style={{ padding: "0.375rem 0.625rem" }} onClick={() => handleDelete(t.id, t.user.name)} id={`delete-teacher-${t.id}`}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-content">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Add New Teacher</h3>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)" }}><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label className="form-label">Full Name *</label><input className="form-input" placeholder="Prof. Rajesh Nair" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div><label className="form-label">Email *</label><input type="email" className="form-input" placeholder="rajesh.nair@edumanage.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                  <div><label className="form-label">Employee ID *</label><input className="form-input" placeholder="EMP-IND-105" required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} /></div>
                  <div><label className="form-label">Department</label><input className="form-input" placeholder="Mathematics & Science" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
                  <div style={{ gridColumn: "1 / -1" }}><label className="form-label">Qualification</label><input className="form-input" placeholder="M.Sc., B.Ed. (Mathematics)" value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} /></div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving} id="save-teacher-btn">{saving ? "Saving..." : "Add Teacher"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
