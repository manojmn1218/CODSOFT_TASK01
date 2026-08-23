"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { FileText, Plus, X } from "lucide-react";
import { format } from "date-fns";

interface Exam {
  id: string;
  name: string;
  type: string;
  date: string;
  totalMarks: number;
  class: { name: string; section: string };
  subject: { name: string };
  _count: { results: number };
}

interface Class { id: string; name: string; section: string; }
interface Subject { id: string; name: string; classId: string; }

const typeColors: Record<string, string> = {
  MID_TERM: "badge-warning", FINAL: "badge-danger", UNIT_TEST: "badge-primary", ASSIGNMENT: "badge-accent",
};

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", classId: "", subjectId: "", date: "", totalMarks: "100", type: "UNIT_TEST" });

  useEffect(() => {
    Promise.all([
      fetch("/api/exams").then(r => r.json()),
      fetch("/api/classes").then(r => r.json()),
    ]).then(([e, c]) => {
      setExams(Array.isArray(e) ? e : []);
      setClasses(Array.isArray(c) ? c : []);
      setLoading(false);
    });
    // Also load subjects
    fetch("/api/subjects").then(r => r.json()).then(d => setSubjects(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const filteredSubjects = subjects.filter(s => !form.classId || s.classId === form.classId);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, totalMarks: parseInt(form.totalMarks) }) });
    if (res.ok) {
      const refreshed = await fetch("/api/exams").then(r => r.json());
      setExams(Array.isArray(refreshed) ? refreshed : []);
      setShowModal(false);
      setForm({ name: "", classId: "", subjectId: "", date: "", totalMarks: "100", type: "UNIT_TEST" });
    }
    setSaving(false);
  }

  return (
    <div>
      <TopBar title="Examinations" subtitle={`${exams.length} exams managed`} />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Exam Management</h2>
            <p className="section-subtitle">Create and manage examinations across all classes</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-exam-btn"><Plus size={16} /> Add Exam</button>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: "0.75rem", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>Loading exams...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Exam Name</th><th>Type</th><th>Class</th><th>Subject</th><th>Date</th><th>Total Marks</th><th>Results</th></tr>
              </thead>
              <tbody>
                {exams.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "hsl(215 16% 47%)" }}><FileText size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.4 }} />No exams found</td></tr>
                ) : exams.map(exam => (
                  <tr key={exam.id}>
                    <td><div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{exam.name}</div></td>
                    <td><span className={`badge ${typeColors[exam.type] || "badge-primary"}`}>{exam.type.replace("_", " ")}</span></td>
                    <td style={{ fontSize: "0.8rem" }}>{exam.class.name} - {exam.class.section}</td>
                    <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 65%)" }}>{exam.subject.name}</td>
                    <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>{format(new Date(exam.date), "MMM d, yyyy")}</td>
                    <td><span className="badge badge-primary">{exam.totalMarks}</span></td>
                    <td style={{ fontSize: "0.8rem" }}>{exam._count.results} submitted</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-content">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Add New Exam</h3>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)" }}><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div><label className="form-label">Exam Name *</label><input className="form-input" placeholder="Mathematics Mid-Term" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="form-label">Class *</label>
                    <select className="form-select" required value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value, subjectId: "" }))}>
                      <option value="">— Select —</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Subject *</label>
                    <select className="form-select" required value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
                      <option value="">— Select —</option>
                      {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="UNIT_TEST">Unit Test</option>
                      <option value="MID_TERM">Mid Term</option>
                      <option value="FINAL">Final</option>
                      <option value="ASSIGNMENT">Assignment</option>
                    </select>
                  </div>
                  <div><label className="form-label">Total Marks</label><input type="number" className="form-input" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))} /></div>
                  <div style={{ gridColumn: "1 / -1" }}><label className="form-label">Date *</label><input type="date" className="form-input" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving}>{saving ? "Saving..." : "Create Exam"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
