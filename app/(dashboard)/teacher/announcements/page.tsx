"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Megaphone } from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  target: string;
  createdAt: string;
  createdBy: { name: string };
}

const targetColors: Record<string, string> = { ALL: "badge-primary", STUDENT: "badge-success", TEACHER: "badge-accent", ADMIN: "badge-warning" };

function AnnouncementsListPage({ role }: { role: string }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/announcements").then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  return (
    <div>
      <TopBar title="Announcements" subtitle="Notices and updates for you" />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Announcements</h2>
            <p className="section-subtitle">{items.length} announcements</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "hsl(215 16% 47%)" }}>
            <Megaphone size={48} style={{ margin: "0 auto 1rem", display: "block", opacity: 0.25 }} />
            <p style={{ fontWeight: 600 }}>No announcements</p>
            <p style={{ fontSize: "0.875rem", marginTop: "0.375rem" }}>Check back later for updates</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {items.map(a => (
              <div key={a.id} className="announcement-card" style={{ padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Megaphone size={16} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "hsl(213 31% 91%)" }}>{a.title}</h3>
                      <span className={`badge ${targetColors[a.target] || "badge-primary"}`}>{a.target}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 45%)" }}>{format(new Date(a.createdAt), "MMMM d, yyyy")}</div>
                  </div>
                </div>
                <p style={{ fontSize: "0.875rem", color: "hsl(215 16% 60%)", lineHeight: 1.7, paddingLeft: "2.875rem" }}>{a.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeacherAnnouncementsPage() {
  return <AnnouncementsListPage role="TEACHER" />;
}
