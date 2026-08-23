"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Users, Plus, Search, X, GraduationCap, AlertCircle } from "lucide-react";
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

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
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

  const genderBadge = (g: string) => g === "MALE" ? "badge-primary" : "badge-accent";

  return (
    <div>
      <TopBar title="Students" subtitle="Manage and enroll students across your classes" />
      <div className="page-container">
        {/* Header */}
        <div className="section-header">
          <div>
            <h2 className="section-title">Enrolled Students</h2>
            <p className="section-subtitle">Add new students or look up student academic records</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setAddError(""); }} id="teacher-add-student-btn" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
            <Plus size={16} /> Add Student
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="search-box">
            <Search size={15} color="hsl(215 16% 47%)" />
            <input type="text" placeholder="Search by name, roll, or email..." value={search} onChange={e => setSearch(e.target.value)} id="teacher-student-search" />
          </div>
          <span style={{ fontSize: "0.8rem", color: "hsl(215 16% 47%)" }}>{filtered.length} student{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: "0.75rem", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>
              <div style={{ width: 32, height: 32, border: "3px solid hsl(var(--border))", borderTopColor: "#a855f7", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
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
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "hsl(215 16% 47%)" }}><Users size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.4 }} />No students found</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="avatar" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.25)" }}>{s.user.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.user.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>{s.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-accent">{s.rollNumber}</span></td>
                    <td>{s.class ? `${s.class.name} - ${s.class.section}` : <span style={{ color: "hsl(215 16% 40%)" }}>—</span>}</td>
                    <td><span className={`badge ${genderBadge(s.gender)}`}>{s.gender}</span></td>
                    <td>
                      <div style={{ fontSize: "0.8rem" }}>{s.parentName || "—"}</div>
                      <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 47%)" }}>{s.parentPhone || ""}</div>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>{format(new Date(s.admissionDate), "MMM d, yyyy")}</td>
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
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={18} color="#a855f7" /></div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Add Student to Class</h3>
                    <p style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>Student will be saved to the database and visible to Admin & Teachers</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)", padding: 4 }}><X size={20} /></button>
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
                  <div><label className="form-label">Roll Number *</label><input className="form-input" placeholder="STU202412" required value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} /></div>
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

                <div style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", fontSize: "0.8rem", color: "hsl(215 16% 65%)" }}>
                  🔑 <strong>Default Login:</strong> Initial student password is set to <span style={{ color: "#a855f7", fontWeight: 700 }}>student123</span>. Student can change it once logged in.
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center", background: "linear-gradient(135deg, #a855f7, #ec4899)" }} disabled={saving} id="teacher-save-student-btn">
                    {saving ? "Saving..." : "Add Student"}
                  </button>
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
