"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/layout/TopBar";
import { BookMarked, Award } from "lucide-react";
import { format } from "date-fns";

interface ExamResult {
  id: string;
  marksObtained: number;
  grade: string | null;
  remarks: string | null;
  exam: {
    name: string;
    totalMarks: number;
    type: string;
    date: string;
    subject: { name: string };
    class: { name: string; section: string };
  };
}

const gradeColors: Record<string, string> = {
  "A+": "#10b981", "A": "#10b981", "B": "#3b82f6", "C": "#f59e0b", "D": "#f97316", "F": "#ef4444"
};

export default function StudentResultsPage() {
  const { data: session } = useSession();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/students").then(r => r.json()).then(async (students) => {
      const all = Array.isArray(students) ? students : [];
      const me = all.find((s: { user: { email: string } }) => s.user.email === session.user?.email);
      if (!me) { setLoading(false); return; }

      const res = await fetch(`/api/results?studentId=${me.id}`).then(r => r.json());
      setResults(Array.isArray(res) ? res : []);
      setLoading(false);
    });
  }, [session]);

  const avgPct = results.length > 0
    ? Math.round(results.reduce((s, r) => s + (r.marksObtained / r.exam.totalMarks) * 100, 0) / results.length)
    : 0;

  const bestGrade = results.length > 0
    ? results.sort((a, b) => (b.marksObtained / b.exam.totalMarks) - (a.marksObtained / a.exam.totalMarks))[0]
    : null;

  return (
    <div>
      <TopBar title="My Results" subtitle="Your examination results and grades" />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Exam Results</h2>
            <p className="section-subtitle">{results.length} results available</p>
          </div>
        </div>

        {/* Summary */}
        {results.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Average Score", value: `${avgPct}%`, color: avgPct >= 60 ? "#10b981" : "#ef4444" },
              { label: "Exams Taken", value: results.length, color: "#3b82f6" },
              { label: "Best Subject", value: bestGrade?.exam.subject.name || "—", color: "#a855f7" },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ padding: "1.25rem", borderColor: `${s.color}20`, textAlign: "center" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color, wordBreak: "break-word" }}>{s.value}</div>
                <div style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Results cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}>Loading results...</div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "hsl(215 16% 47%)" }}>
            <BookMarked size={48} style={{ margin: "0 auto 1rem", display: "block", opacity: 0.25 }} />
            <p style={{ fontWeight: 600 }}>No results available</p>
            <p style={{ fontSize: "0.875rem", marginTop: "0.375rem" }}>Your exam results will appear here once published</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {results.map(r => {
              const pct = Math.round((r.marksObtained / r.exam.totalMarks) * 100);
              const gradeColor = gradeColors[r.grade || "F"] || "#6b7280";
              return (
                <div key={r.id} className="stat-card" style={{ padding: "1.5rem", borderColor: `${gradeColor}20` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{r.exam.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "hsl(215 16% 55%)" }}>{r.exam.subject.name}</div>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${gradeColor}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${gradeColor}30`, flexShrink: 0 }}>
                      <span style={{ fontWeight: 900, color: gradeColor, fontSize: "1rem" }}>{r.grade}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>Score</span>
                      <span style={{ fontWeight: 700, color: gradeColor }}>{r.marksObtained}/{r.exam.totalMarks} ({pct}%)</span>
                    </div>
                    <div className="progress-bar" style={{ height: 8 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: gradeColor }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "hsl(215 16% 45%)" }}>
                    <span>{r.exam.type.replace("_", " ")}</span>
                    <span>{format(new Date(r.exam.date), "MMM d, yyyy")}</span>
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
