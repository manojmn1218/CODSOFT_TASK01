"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/layout/TopBar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  class: { name: string; section: string };
}

export default function StudentAttendancePage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, rate: 0 });

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/students").then(r => r.json()).then(async (students) => {
      const all = Array.isArray(students) ? students : [];
      const me = all.find((s: { user: { email: string } }) => s.user.email === session.user?.email);
      if (!me) { setLoading(false); return; }

      const attRes = await fetch(`/api/attendance?studentId=${me.id}`).then(r => r.json());
      const att = Array.isArray(attRes) ? attRes : [];
      setRecords(att);
      const present = att.filter((a: { status: string }) => a.status === "PRESENT").length;
      const absent = att.filter((a: { status: string }) => a.status === "ABSENT").length;
      const late = att.filter((a: { status: string }) => a.status === "LATE").length;
      setStats({ total: att.length, present, absent, late, rate: att.length > 0 ? Math.round(((present + late) / att.length) * 100) : 0 });
      setLoading(false);
    });
  }, [session]);

  const statusColors: Record<string, string> = { PRESENT: "badge-success", ABSENT: "badge-danger", LATE: "badge-warning" };

  return (
    <div>
      <TopBar title="My Attendance" subtitle="Your attendance record for this academic year" />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Attendance Record</h2>
            <p className="section-subtitle">{records.length} entries tracked</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Days", value: stats.total, color: "#3b82f6" },
            { label: "Present", value: stats.present, color: "#10b981" },
            { label: "Absent", value: stats.absent, color: "#ef4444" },
            { label: "Late", value: stats.late, color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: "1.25rem", borderColor: `${s.color}20`, textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color }}>{loading ? "—" : s.value}</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Rate bar */}
        <div className="chart-container" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Overall Attendance Rate</span>
            <span style={{ fontWeight: 800, color: stats.rate >= 75 ? "#10b981" : "#ef4444", fontSize: "1.125rem" }}>{stats.rate}%</span>
          </div>
          <div className="progress-bar" style={{ height: 12 }}>
            <div className="progress-fill" style={{ width: `${stats.rate}%`, background: stats.rate >= 75 ? "#10b981" : "#ef4444" }} />
          </div>
          {stats.rate < 75 && <p style={{ fontSize: "0.78rem", color: "#ef4444", marginTop: "0.5rem" }}>⚠ Attendance below 75% minimum requirement</p>}
        </div>

        {/* Table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: "0.75rem", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>Loading attendance...</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>#</th><th>Date</th><th>Class</th><th>Status</th></tr></thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: "2.5rem", color: "hsl(215 16% 47%)" }}><Calendar size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.4 }} />No attendance records</td></tr>
                ) : records.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: "hsl(215 16% 45%)", fontSize: "0.78rem" }}>{i + 1}</td>
                    <td style={{ fontWeight: 500, fontSize: "0.875rem" }}>{format(new Date(r.date), "EEEE, MMM d, yyyy")}</td>
                    <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 65%)" }}>{r.class.name} - {r.class.section}</td>
                    <td><span className={`badge ${statusColors[r.status] || "badge-primary"}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
