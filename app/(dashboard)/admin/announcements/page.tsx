"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { Megaphone, Plus, Trash2, X } from "lucide-react";
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

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", target: "ALL" });

  useEffect(() => {
    fetch("/api/announcements").then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      const refreshed = await fetch("/api/announcements").then(r => r.json());
      setItems(Array.isArray(refreshed) ? refreshed : []);
      setShowModal(false);
      setForm({ title: "", content: "", target: "ALL" });
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div>
      <TopBar title="Announcements" subtitle="Broadcast messages to students, teachers, or everyone" />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Announcements</h2>
            <p className="section-subtitle">{items.length} active announcements</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} id="add-announcement-btn"><Plus size={16} /> New Announcement</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}>Loading...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}><Megaphone size={40} style={{ margin: "0 auto 1rem", display: "block", opacity: 0.3 }} /><p>No announcements yet</p></div>
            ) : items.map(a => (
              <div key={a.id} className="announcement-card" style={{ padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "hsl(213 31% 91%)" }}>{a.title}</h3>
                      <span className={`badge ${targetColors[a.target] || "badge-primary"}`}>{a.target}</span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "hsl(215 16% 60%)", lineHeight: 1.6 }}>{a.content}</p>
                    <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "hsl(215 16% 45%)" }}>
                      By {a.createdBy.name} · {format(new Date(a.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                  <button className="btn btn-danger" style={{ padding: "0.375rem 0.625rem", flexShrink: 0 }} onClick={() => handleDelete(a.id)} id={`delete-ann-${a.id}`}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal-content">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>New Announcement</h3>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)" }}><X size={20} /></button>
              </div>
              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div><label className="form-label">Title *</label><input className="form-input" placeholder="Announcement title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div>
                  <label className="form-label">Target Audience</label>
                  <select className="form-select" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}>
                    <option value="ALL">All (Everyone)</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="TEACHER">Teachers Only</option>
                    <option value="ADMIN">Admin Only</option>
                  </select>
                </div>
                <div><label className="form-label">Content *</label><textarea className="form-input" placeholder="Write your announcement..." required rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} style={{ resize: "vertical", minHeight: 100 }} /></div>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving}>{saving ? "Posting..." : "Post Announcement"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
