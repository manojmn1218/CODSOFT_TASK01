"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/layout/TopBar";
import { Calendar, BookMarked, DollarSign, Megaphone, TrendingUp, Award } from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: { name: string };
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [attendanceData, setAttendanceData] = useState({ total: 0, present: 0, rate: 0 });
  const [feeData, setFeeData] = useState({ pending: 0, paid: 0, overdue: 0 });
  const [examsTaken, setExamsTaken] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) return;

    // Get student profile first
    fetch("/api/students").then(r => r.json()).then(async (students) => {
      const all = Array.isArray(students) ? students : [];
      const myProfile = all.find((s: { user: { email: string } }) => s.user.email === session?.user?.email);

      if (myProfile) {
        // Get attendance
        const attRes = await fetch(`/api/attendance?studentId=${myProfile.id}`).then(r => r.json());
        const att = Array.isArray(attRes) ? attRes : [];
        const present = att.filter((a: { status: string }) => a.status === "PRESENT").length;
        setAttendanceData({ total: att.length, present, rate: att.length > 0 ? Math.round((present / att.length) * 100) : 0 });

        // Get fees
        const feeRes = await fetch(`/api/fees?studentId=${myProfile.id}`).then(r => r.json());
        const fees = Array.isArray(feeRes) ? feeRes : [];
        setFeeData({
          pending: fees.filter((f: { status: string }) => f.status === "PENDING").length,
          paid: fees.filter((f: { status: string }) => f.status === "PAID").length,
          overdue: fees.filter((f: { status: string }) => f.status === "OVERDUE").length,
        });

        // Get exam results count
        const resultsRes = await fetch(`/api/results?studentId=${myProfile.id}`).then(r => r.json());
        const results = Array.isArray(resultsRes) ? resultsRes : [];
        setExamsTaken(results.length);
      }

      const annRes = await fetch("/api/announcements").then(r => r.json());
      setAnnouncements(Array.isArray(annRes) ? annRes.slice(0, 5) : []);
      setLoading(false);
    });
  }, [session]);

  return (
    <div>
      <TopBar title="Student Dashboard" subtitle={`Hello, ${session?.user?.name?.split(" ")[0] || "Student"} 👋`} />
      <div className="page-container">
        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: "Attendance Rate", value: `${attendanceData.rate}%`, icon: Calendar, color: "#3b82f6", sub: `${attendanceData.present}/${attendanceData.total} days` },
            { label: "Pending Fees", value: feeData.pending, icon: DollarSign, color: feeData.pending > 0 ? "#f59e0b" : "#10b981", sub: feeData.overdue > 0 ? `${feeData.overdue} overdue!` : "All up to date" },
            { label: "Fees Paid", value: feeData.paid, icon: TrendingUp, color: "#10b981", sub: "This academic year" },
            { label: "Exams Taken", value: examsTaken, icon: Award, color: "#a855f7", sub: "Results available" },
          ].map(card => (
            <div key={card.label} className="stat-card" style={{ borderColor: `${card.color}20` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", border: `1px solid ${card.color}25` }}>
                <card.icon size={20} color={card.color} />
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "hsl(213 31% 91%)", lineHeight: 1 }}>{loading ? "—" : card.value}</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)", marginTop: "0.25rem" }}>{card.label}</div>
              <div style={{ fontSize: "0.72rem", color: `${card.color}aa`, marginTop: "0.25rem" }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Attendance visual + announcements */}
        <div className="content-grid">
          <div className="chart-container">
            <h3 style={{ fontWeight: 700, marginBottom: "1.25rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Calendar size={16} color="#3b82f6" /> Attendance Overview</h3>
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 1.5rem" }}>
                <svg viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                  <circle cx="70" cy="70" r="58" fill="none" stroke="#3b82f6" strokeWidth="14"
                    strokeDasharray={`${2 * Math.PI * 58 * attendanceData.rate / 100} ${2 * Math.PI * 58}`}
                    strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#3b82f6" }}>{attendanceData.rate}%</div>
                  <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 47%)" }}>Present</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[
                  { label: "Present", value: attendanceData.present, color: "#10b981" },
                  { label: "Absent/Late", value: attendanceData.total - attendanceData.present, color: "#ef4444" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "0.75rem", borderRadius: 8, background: `${s.color}10`, border: `1px solid ${s.color}20` }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 47%)" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="chart-container">
            <h3 style={{ fontWeight: 700, marginBottom: "1.25rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Megaphone size={16} color="#a855f7" /> Notices for You</h3>
            {announcements.length === 0 ? (
              <p style={{ color: "hsl(215 16% 47%)", fontSize: "0.875rem" }}>No announcements.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {announcements.map(a => (
                  <div key={a.id} className="announcement-card">
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>{a.title}</div>
                    <p style={{ fontSize: "0.78rem", color: "hsl(215 16% 55%)", lineHeight: 1.5 }}>{a.content.slice(0, 80)}…</p>
                    <div style={{ marginTop: "0.375rem", fontSize: "0.7rem", color: "hsl(215 16% 45%)" }}>{format(new Date(a.createdAt), "MMM d")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Account Security Info Banner */}
        <div style={{ marginTop: "1.5rem", padding: "1.25rem 1.5rem", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "hsl(213 31% 91%)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>🔐 Account Security</span>
              <span className="badge badge-success" style={{ fontSize: "0.65rem" }}>Active</span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)", marginTop: "0.25rem" }}>
              Keep your student account secure. You can update your default password anytime using the <strong>Password</strong> button in the top navigation bar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
