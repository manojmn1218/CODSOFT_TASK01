"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
  description: string | null;
}

export default function StudentFeesPage() {
  const { data: session } = useSession();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/students").then(r => r.json()).then(async (students) => {
      const all = Array.isArray(students) ? students : [];
      const me = all.find((s: { user: { email: string } }) => s.user.email === session.user?.email);
      if (!me) { setLoading(false); return; }

      const res = await fetch(`/api/fees?studentId=${me.id}`).then(r => r.json());
      setFees(Array.isArray(res) ? res : []);
      setLoading(false);
    });
  }, [session]);

  const stats = {
    total: fees.reduce((s, f) => s + f.amount, 0),
    paid: fees.filter(f => f.status === "PAID").reduce((s, f) => s + f.amount, 0),
    pending: fees.filter(f => f.status === "PENDING").reduce((s, f) => s + f.amount, 0),
    overdue: fees.filter(f => f.status === "OVERDUE").reduce((s, f) => s + f.amount, 0),
  };

  const statusIcon = (s: string) => s === "PAID" ? <CheckCircle size={16} color="#10b981" /> : s === "OVERDUE" ? <XCircle size={16} color="#ef4444" /> : <Clock size={16} color="#f59e0b" />;
  const statusClass = (s: string) => s === "PAID" ? "badge-success" : s === "OVERDUE" ? "badge-danger" : "badge-warning";

  return (
    <div>
      <TopBar title="Fee Status" subtitle="Your fee payments and outstanding dues" />
      <div className="page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">My Fee Records</h2>
            <p className="section-subtitle">Track your payments and dues</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total Paid", value: stats.paid, color: "#10b981" },
            { label: "Pending", value: stats.pending, color: "#f59e0b" },
            { label: "Overdue", value: stats.overdue, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: "1.25rem", borderColor: `${s.color}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <DollarSign size={20} color={s.color} />
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>₹{(s.value / 1000).toFixed(1)}K</div>
                  <div style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)" }}>{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fee list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}>Loading fee records...</div>
        ) : fees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "hsl(215 16% 47%)" }}>
            <DollarSign size={48} style={{ margin: "0 auto 1rem", display: "block", opacity: 0.25 }} />
            <p style={{ fontWeight: 600 }}>No fee records</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {fees.map(fee => (
              <div key={fee.id} className="announcement-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: fee.status === "PAID" ? "rgba(16,185,129,0.15)" : fee.status === "OVERDUE" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {statusIcon(fee.status)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{fee.type}</div>
                      <div style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>
                        Due: {format(new Date(fee.dueDate), "MMM d, yyyy")}
                        {fee.paidDate && ` · Paid: ${format(new Date(fee.paidDate), "MMM d, yyyy")}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: fee.status === "PAID" ? "#10b981" : fee.status === "OVERDUE" ? "#ef4444" : "#f59e0b" }}>₹{fee.amount.toLocaleString()}</div>
                    <span className={`badge ${statusClass(fee.status)}`}>{fee.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
