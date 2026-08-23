"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { FileText } from "lucide-react";
import { format } from "date-fns";

interface ExamResult {
  id: string;
  marksObtained: number;
  grade: string | null;
  exam: { name: string; totalMarks: number; type: string; subject: { name: string } };
  student: { user: { name: string }; rollNumber: string };
}

interface Exam {
  id: string;
  name: string;
  totalMarks: number;
  date: string;
  type: string;
  class: { name: string; section: string };
  subject: { name: string };
  _count: { results: number };
}

export default function TeacherResultsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exams").then(r => r.json()).then(d => { setExams(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const typeColors: Record<string, string> = { MID_TERM: "#f59e0b", FINAL: "#ef4444", UNIT_TEST: "#3b82f6", ASSIGNMENT: "#a855f7" };

  return (
    <div>
      <TopBar title="Exam Results" subtitle="Review and manage examination results" />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Examination Results</h2>
            <p className="section-subtitle">All exams and submission status</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}>Loading...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {exams.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}>
                <FileText size={40} style={{ margin: "0 auto 1rem", display: "block", opacity: 0.3 }} />
                <p>No exams found</p>
              </div>
            ) : exams.map(exam => {
              const color = typeColors[exam.type] || "#3b82f6";
              return (
                <div key={exam.id} className="stat-card" style={{ borderColor: `${color}20`, padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                    <span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}30`, fontSize: "0.65rem" }}>{exam.type.replace("_", " ")}</span>
                    <span style={{ fontSize: "0.72rem", color: "hsl(215 16% 45%)" }}>{format(new Date(exam.date), "MMM d, yyyy")}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.375rem", color: "hsl(213 31% 91%)" }}>{exam.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)", marginBottom: "1rem" }}>
                    {exam.class.name} {exam.class.section} · {exam.subject.name}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "1.25rem", fontWeight: 800, color }}>{exam._count.results}</div>
                      <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 47%)" }}>Results submitted</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "hsl(213 31% 85%)" }}>{exam.totalMarks}</div>
                      <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 47%)" }}>Total marks</div>
                    </div>
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
