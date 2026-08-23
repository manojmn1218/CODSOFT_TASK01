"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/layout/TopBar";
import { BookOpen, Users, ClipboardList, FileText, Megaphone } from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  target: string;
  createdAt: string;
  createdBy: { name: string };
}

interface ClassData {
  id: string;
  name: string;
  section: string;
  _count: { students: number };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
}

interface ExamRecord {
  id: string;
  date: string;
}

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [attendanceToday, setAttendanceToday] = useState(0);
  const [examCount, setExamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/announcements").then(r => r.json()),
      fetch("/api/classes").then(r => r.json()),
      fetch("/api/attendance").then(r => r.json()),
      fetch("/api/exams").then(r => r.json()),
    ]).then(([a, c, att, exams]) => {
      setAnnouncements(Array.isArray(a) ? a.slice(0, 5) : []);
      setClasses(Array.isArray(c) ? c : []);

      // Count today's attendance records
      const today = format(new Date(), "yyyy-MM-dd");
      const attArr = Array.isArray(att) ? att : [];
      const todayCount = attArr.filter((r: AttendanceRecord) => r.date && r.date.startsWith(today)).length;
      setAttendanceToday(todayCount);

      // Count exams this month
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const examsArr = Array.isArray(exams) ? exams : [];
      const monthExams = examsArr.filter((e: ExamRecord) => {
        const d = new Date(e.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }).length;
      setExamCount(monthExams);

      setLoading(false);
    });
  }, []);

  return (
    <div>
      <TopBar title="Teacher Dashboard" subtitle={`Welcome back, ${session?.user?.name?.split(" ")[0] || "Teacher"}`} />
      <div className="page-container">
        {/* Quick stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[
            { label: "My Classes", value: classes.length, icon: BookOpen, color: "#a855f7" },
            { label: "Total Students", value: classes.reduce((s, c) => s + c._count.students, 0), icon: Users, color: "#3b82f6" },
            { label: "Attendance Today", value: attendanceToday, icon: ClipboardList, color: "#10b981" },
            { label: "Exams This Month", value: examCount, icon: FileText, color: "#f59e0b" },
          ].map(card => (
            <div key={card.label} className="stat-card" style={{ borderColor: `${card.color}20` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem", border: `1px solid ${card.color}25` }}>
                <card.icon size={20} color={card.color} />
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "hsl(213 31% 91%)", lineHeight: 1 }}>{loading ? "—" : card.value}</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)", marginTop: "0.375rem" }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div className="content-grid">
          {/* Classes */}
          <div className="chart-container">
            <h3 style={{ fontWeight: 700, marginBottom: "1.25rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><BookOpen size={16} color="#a855f7" /> My Classes</h3>
            {classes.length === 0 ? (
              <p style={{ color: "hsl(215 16% 47%)", fontSize: "0.875rem" }}>No classes assigned yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {classes.map((cls, i) => {
                  const colors = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={cls.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${color}20` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${color}25` }}>
                          <BookOpen size={16} color={color} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{cls.name} - Section {cls.section}</div>
                          <div style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>{cls._count.students} students</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <a href="/teacher/attendance" style={{ fontSize: "0.75rem", color, textDecoration: "none", padding: "0.25rem 0.625rem", borderRadius: 6, background: `${color}12`, border: `1px solid ${color}25` }}>Attendance</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Announcements */}
          <div className="chart-container">
            <h3 style={{ fontWeight: 700, marginBottom: "1.25rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><Megaphone size={16} color="#3b82f6" /> Announcements</h3>
            {announcements.length === 0 ? (
              <p style={{ color: "hsl(215 16% 47%)", fontSize: "0.875rem" }}>No announcements.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {announcements.map(a => (
                  <div key={a.id} className="announcement-card">
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.375rem" }}>{a.title}</div>
                    <p style={{ fontSize: "0.78rem", color: "hsl(215 16% 55%)", lineHeight: 1.5 }}>{a.content.slice(0, 100)}…</p>
                    <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", color: "hsl(215 16% 45%)" }}>{format(new Date(a.createdAt), "MMM d, yyyy")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
