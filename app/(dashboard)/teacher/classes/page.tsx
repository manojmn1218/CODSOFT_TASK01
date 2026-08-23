"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { BookOpen } from "lucide-react";

interface Class {
  id: string;
  name: string;
  section: string;
  academicYear: string;
  _count: { students: number; subjects: number };
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/classes").then(r => r.json()).then(d => { setClasses(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  return (
    <div>
      <TopBar title="My Classes" subtitle="Classes you are assigned to teach" />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Assigned Classes</h2>
            <p className="section-subtitle">{classes.length} classes · Academic Year 2024-25</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}>Loading...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {classes.map((cls, i) => {
              const colors = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b"];
              const color = colors[i % colors.length];
              return (
                <div key={cls.id} className="stat-card" style={{ borderColor: `${color}20`, padding: "1.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.25rem" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}30` }}>
                      <BookOpen size={22} color={color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.125rem", color: "hsl(213 31% 91%)" }}>{cls.name}</div>
                      <div style={{ fontSize: "0.825rem", color, fontWeight: 600 }}>Section {cls.section}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    {[
                      { label: "Students", value: cls._count.students },
                      { label: "Subjects", value: cls._count.subjects },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: "center", padding: "0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{m.value}</div>
                        <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 47%)" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <a href="/teacher/attendance" style={{ flex: 1, textAlign: "center", padding: "0.5rem", borderRadius: 8, background: `${color}15`, border: `1px solid ${color}30`, color, fontSize: "0.78rem", fontWeight: 600, textDecoration: "none" }}>Mark Attendance</a>
                    <a href="/teacher/results" style={{ flex: 1, textAlign: "center", padding: "0.5rem", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "hsl(215 16% 65%)", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none" }}>Results</a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
