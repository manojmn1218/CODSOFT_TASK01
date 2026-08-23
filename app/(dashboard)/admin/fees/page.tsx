"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface Fee {
  id: string;
  amount: number;
  type: string;
  status: string;
  dueDate: string;
  paidDate: string | null;
  student: { user: { name: string }; rollNumber: string };
}

export default function FeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/fees").then(r => r.json()).then(d => { setFees(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = filter === "ALL" ? fees : fees.filter(f => f.status === filter);

  const stats = {
    total: fees.reduce((s, f) => s + f.amount, 0),
    paid: fees.filter(f => f.status === "PAID").reduce((s, f) => s + f.amount, 0),
    pending: fees.filter(f => f.status === "PENDING").reduce((s, f) => s + f.amount, 0),
    overdue: fees.filter(f => f.status === "OVERDUE").reduce((s, f) => s + f.amount, 0),
  };

  async function markPaid(id: string) {
    await fetch("/api/fees", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "PAID" }) });
    setFees(prev => prev.map(f => f.id === id ? { ...f, status: "PAID", paidDate: new Date().toISOString() } : f));
  }

  const statusIcon = (s: string) => s === "PAID" ? <CheckCircle size={14} color="#10b981" /> : s === "OVERDUE" ? <XCircle size={14} color="#ef4444" /> : <Clock size={14} color="#f59e0b" />;
  const statusClass = (s: string) => s === "PAID" ? "badge-success" : s === "OVERDUE" ? "badge-danger" : "badge-warning";

  return (
    <div>
      <TopBar title="Fee Management" subtitle="Track and collect student fees" />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Fee Records</h2>
            <p className="section-subtitle">Monitor fee collection and outstanding dues</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Assessed", value: stats.total, color: "#3b82f6" },
            { label: "Collected", value: stats.paid, color: "#10b981" },
            { label: "Pending", value: stats.pending, color: "#f59e0b" },
            { label: "Overdue", value: stats.overdue, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: "1.25rem", borderColor: `${s.color}20` }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>₹{(s.value / 1000).toFixed(1)}K</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>{s.label}</div>
              <div className="progress-bar" style={{ marginTop: "0.75rem" }}>
                <div className="progress-fill" style={{ width: `${stats.total > 0 ? (s.value / stats.total) * 100 : 0}%`, background: s.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {["ALL", "PAID", "PENDING", "OVERDUE"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="btn" style={{ padding: "0.4rem 0.875rem", fontSize: "0.78rem", background: filter === f ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)", border: filter === f ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)", color: filter === f ? "#3b82f6" : "hsl(215 16% 55%)" }}>{f}</button>
          ))}
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: "0.75rem", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>Loading fee records...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Student</th><th>Roll No.</th><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: "2.5rem", color: "hsl(215 16% 47%)" }}><DollarSign size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.4 }} />No fee records</td></tr>
                ) : filtered.map(fee => (
                  <tr key={fee.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div className="avatar" style={{ width: 30, height: 30, background: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: "0.7rem" }}>{fee.student.user.name[0]}</div>
                        <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{fee.student.user.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{fee.student.rollNumber}</span></td>
                    <td style={{ fontSize: "0.8rem" }}>{fee.type}</td>
                    <td style={{ fontWeight: 700, color: "#10b981" }}>₹{fee.amount.toLocaleString()}</td>
                    <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>{format(new Date(fee.dueDate), "MMM d, yyyy")}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        {statusIcon(fee.status)}
                        <span className={`badge ${statusClass(fee.status)}`}>{fee.status}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {fee.status !== "PAID" && (
                        <button className="btn btn-success" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }} onClick={() => markPaid(fee.id)} id={`mark-paid-${fee.id}`}>Mark Paid</button>
                      )}
                    </td>
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
