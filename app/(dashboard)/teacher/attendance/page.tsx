"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface Student {
  id: string;
  rollNumber: string;
  user: { name: string };
}

interface Class {
  id: string;
  name: string;
  section: string;
  students: Student[];
}

interface AttendanceRecord {
  [studentId: string]: "PRESENT" | "ABSENT" | "LATE";
}

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [students, setStudents] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classes").then(r => r.json()).then(d => {
      const c = Array.isArray(d) ? d : [];
      setClasses(c);
      if (c.length > 0) setSelectedClass(c[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    fetch(`/api/students`).then(r => r.json()).then(d => {
      const all = Array.isArray(d) ? d : [];
      const classStudents = all.filter((s: { classId: string | null }) => s.classId === selectedClass);
      setStudents(classStudents);
      // Init all as PRESENT
      const init: AttendanceRecord = {};
      classStudents.forEach((s: Student) => { init[s.id] = "PRESENT"; });
      setAttendance(init);
    });
  }, [selectedClass]);

  async function handleSave() {
    setSaving(true);
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId, classId: selectedClass, date, status,
    }));
    await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records }) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const total = students.length;
  const present = Object.values(attendance).filter(s => s === "PRESENT").length;
  const absent = Object.values(attendance).filter(s => s === "ABSENT").length;
  const late = Object.values(attendance).filter(s => s === "LATE").length;

  const statusIcon = (s: string) => s === "PRESENT" ? <CheckCircle size={16} color="#10b981" /> : s === "ABSENT" ? <XCircle size={16} color="#ef4444" /> : <Clock size={16} color="#f59e0b" />;

  return (
    <div>
      <TopBar title="Mark Attendance" subtitle="Record daily attendance for your class" />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Attendance</h2>
            <p className="section-subtitle">Select class and date, then mark each student</p>
          </div>
          {saved && <div className="badge badge-success" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>✓ Saved successfully</div>}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <label className="form-label">Select Class</label>
            <select className="form-select" style={{ width: 200 }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" style={{ width: 180 }} value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        {/* Summary */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total", value: total, color: "#3b82f6" },
            { label: "Present", value: present, color: "#10b981" },
            { label: "Absent", value: absent, color: "#ef4444" },
            { label: "Late", value: late, color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} style={{ padding: "0.75rem 1.25rem", borderRadius: 8, background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "hsl(215 16% 55%)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Student List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "hsl(215 16% 47%)" }}>Loading...</div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}><ClipboardList size={40} style={{ margin: "0 auto 1rem", display: "block", opacity: 0.3 }} /><p>No students in this class</p></div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
              {students.map((s, idx) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1.25rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", transition: "background 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "hsl(215 16% 45%)", width: 24, textAlign: "right" }}>{idx + 1}</span>
                    <div className="avatar" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>{s.user.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.user.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>{s.rollNumber}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {statusIcon(attendance[s.id] || "PRESENT")}
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      {(["PRESENT", "LATE", "ABSENT"] as const).map(status => (
                        <button key={status} onClick={() => setAttendance(a => ({ ...a, [s.id]: status }))}
                          style={{ padding: "0.3rem 0.75rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", border: "1px solid", transition: "all 0.15s",
                            background: attendance[s.id] === status ? (status === "PRESENT" ? "rgba(16,185,129,0.2)" : status === "ABSENT" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)") : "rgba(255,255,255,0.04)",
                            borderColor: attendance[s.id] === status ? (status === "PRESENT" ? "rgba(16,185,129,0.5)" : status === "ABSENT" ? "rgba(239,68,68,0.5)" : "rgba(245,158,11,0.5)") : "rgba(255,255,255,0.1)",
                            color: attendance[s.id] === status ? (status === "PRESENT" ? "#10b981" : status === "ABSENT" ? "#ef4444" : "#f59e0b") : "hsl(215 16% 55%)",
                          }} id={`att-${s.id}-${status}`}>{status === "PRESENT" ? "P" : status === "ABSENT" ? "A" : "L"}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-attendance-btn" style={{ padding: "0.75rem 2rem" }}>
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
