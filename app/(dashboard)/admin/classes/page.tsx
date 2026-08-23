"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/layout/TopBar";
import { BookOpen, Plus, X, School } from "lucide-react";

interface Class {
  id: string;
  name: string;
  section: string;
  academicYear: string;
  teacher: { user: { name: string } } | null;
  _count: { students: number; subjects: number };
}

interface Teacher {
  id: string;
  user: { name: string };
}

export default function ClassesPage() {
  const { data: session } = useSession();
  const userSchool = (session?.user as any)?.schoolName;

  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", section: "", academicYear: "2024-25", teacherId: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/classes").then(r => r.json()),
      fetch("/api/teachers").then(r => r.json()),
    ]).then(([c, t]) => { setClasses(Array.isArray(c) ? c : []); setTeachers(Array.isArray(t) ? t : []); setLoading(false); });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, teacherId: form.teacherId || null }) });
    if (res.ok) {
      const refreshed = await fetch("/api/classes").then(r => r.json());
      setClasses(Array.isArray(refreshed) ? refreshed : []);
      setShowModal(false);
      setForm({ name: "", section: "", academicYear: "2024-25", teacherId: "" });
    }
    setSaving(false);
  }

  return (
    <div>
      <TopBar title="Classes & Divisions" subtitle={`${classes.length} academic divisions`} />
      <div className="page-container">
        {userSchool && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))",
              border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: "0.75rem",
              padding: "0.875rem 1.25rem",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #10b981, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <School size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 55%)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Academic Campus
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "hsl(213 31% 95%)" }}>
                {userSchool}
              </div>
            </div>
          </div>
        )}

        <div className="section-header">
          <div>
            <h2 className="section-title">Class Management</h2>
            <p className="section-subtitle">Manage classes, sections, and class teachers</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-class-btn"><Plus size={16} /> Add Class</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}>Loading...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {classes.map((cls, i) => {
              const colors = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];
              const color = colors[i % colors.length];
              return (
                <div key={cls.id} className="stat-card" style={{ borderColor: `${color}20`, padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}30` }}>
                      <BookOpen size={20} color={color} />
                    </div>
                    <span className="badge badge-primary">{cls.academicYear}</span>
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(213 31% 91%)" }}>{cls.name}</div>
                  <div style={{ fontSize: "0.875rem", color, fontWeight: 600, marginBottom: "1rem" }}>Section {cls.section}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {[
                      { label: "Students", value: cls._count.students },
                      { label: "Subjects", value: cls._count.subjects },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: "center", padding: "0.625rem", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "1.25rem", fontWeight: 700, color }}>{m.value}</div>
                        <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 47%)" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  {cls.teacher && (
                    <div style={{ marginTop: "0.875rem", fontSize: "0.78rem", color: "hsl(215 16% 55%)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.875rem" }}>
                      👤 {cls.teacher.user.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-content">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Add New Class</h3>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)" }}><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div><label className="form-label">Class Name *</label><input className="form-input" placeholder="Grade 10" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                  <div><label className="form-label">Section *</label><input className="form-input" placeholder="A" required value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} /></div>
                  <div><label className="form-label">Academic Year</label><input className="form-input" value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} /></div>
                  <div>
                    <label className="form-label">Class Teacher</label>
                    <select className="form-select" value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}>
                      <option value="">— None —</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving}>{saving ? "Saving..." : "Create Class"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
