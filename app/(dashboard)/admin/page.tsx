"use client";
import { useEffect, useState } from "react";
import TopBar from "@/components/layout/TopBar";
import {
  Shield, Plus, Search, Trash2, Key, X, Users, UserCheck, Building2,
  CheckCircle, AlertCircle, Phone, Mail, Award, Eye, DollarSign,
  FileText, Calendar, TrendingUp, Lock, GraduationCap
} from "lucide-react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

interface Principal {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  schoolName: string | null;
  studentCount?: number;
  teacherCount?: number;
  classCount?: number;
  createdAt: string;
}

interface Stats {
  totalPrincipals: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
}

interface SchoolDetails {
  principal: Principal;
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalExams: number;
    attendanceRate: number;
    feeSummary: {
      total: number;
      paid: number;
      pending: number;
      overdue: number;
    };
  };
  students: Array<{
    id: string;
    rollNumber: string;
    gender: string;
    admissionDate: string;
    parentName: string | null;
    parentPhone: string | null;
    schoolName: string | null;
    user: { name: string; email: string; phone: string | null };
    class: { name: string; section: string } | null;
  }>;
  teachers: Array<{
    id: string;
    employeeId: string;
    qualification: string | null;
    department: string | null;
    schoolName: string | null;
    user: { name: string; email: string; phone: string | null };
    classes: Array<{ name: string; section: string }>;
    subjects: Array<{ name: string; code: string }>;
  }>;
  classes: Array<{
    id: string;
    name: string;
    section: string;
    schoolName: string | null;
    academicYear: string;
    teacher: { user: { name: string } } | null;
    students: Array<{ id: string }>;
    subjects: Array<{ id: string }>;
  }>;
  fees: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    dueDate: string;
    student: { user: { name: string } };
  }>;
  exams: Array<{
    id: string;
    name: string;
    date: string;
    totalMarks: number;
    type: string;
    class: { name: string; section: string };
    subject: { name: string };
  }>;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string })?.id;

  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPrincipals: 0, totalStudents: 0, totalTeachers: 0, totalClasses: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Read-Only School Details Modal / Drawer
  const [selectedPrincipalId, setSelectedPrincipalId] = useState<string | null>(null);
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"overview" | "students" | "teachers" | "classes" | "fees" | "exams">("overview");

  // Add Principal Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    schoolName: "",
    password: "principal123",
  });

  // Manage Password Modal
  const [passwordModalPrincipal, setPasswordModalPrincipal] = useState<Principal | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/principals");
      if (res.ok) {
        const data = await res.json();
        setPrincipals(data.principals || []);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPrincipal(principalId: string) {
    setSelectedPrincipalId(principalId);
    setDetailsLoading(true);
    setActiveDetailTab("overview");

    try {
      const res = await fetch(`/api/principals/details?id=${principalId}`);
      if (res.ok) {
        const data = await res.json();
        setSchoolDetails(data);
      }
    } catch {
      // ignore
    } finally {
      setDetailsLoading(false);
    }
  }

  const filtered = principals.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.schoolName && p.schoolName.toLowerCase().includes(search.toLowerCase())) ||
    (p.phone && p.phone.includes(search))
  );

  async function handleAddPrincipal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setAddError("");

    const res = await fetch("/api/principals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      await fetchData();
      setShowAddModal(false);
      setForm({ name: "", email: "", phone: "", schoolName: "", password: "principal123" });
    } else {
      setAddError(data.error || "Failed to add principal.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove Principal ${name}?`)) return;
    const res = await fetch(`/api/principals?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setPrincipals(prev => prev.filter(p => p.id !== id));
      setStats(prev => ({ ...prev, totalPrincipals: Math.max(0, prev.totalPrincipals - 1) }));
      if (selectedPrincipalId === id) setSelectedPrincipalId(null);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete principal.");
    }
  }

  async function handleAdminPasswordChange(resetToDefault = false) {
    if (!passwordModalPrincipal) return;
    setPasswordSaving(true);
    setPasswordMessage(null);

    const targetPassword = resetToDefault ? "principal123" : newPassword;

    const res = await fetch("/api/principals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: passwordModalPrincipal.id,
        password: targetPassword,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setPasswordMessage({
        type: "success",
        text: resetToDefault
          ? `Password reset to default (principal123) for ${passwordModalPrincipal.name}`
          : `Password updated successfully for ${passwordModalPrincipal.name}`,
      });
      setNewPassword("");
      setTimeout(() => {
        if (passwordModalPrincipal) {
          setPasswordModalPrincipal(null);
          setPasswordMessage(null);
        }
      }, 1500);
    } else {
      setPasswordMessage({ type: "error", text: data.error || "Failed to update password." });
    }
    setPasswordSaving(false);
  }

  return (
    <div>
      <TopBar title="Principals Command Center" subtitle="Multi-Principal Institutional Administration" />
      <div className="page-container">
        
        {/* Banner */}
        <div style={{ marginBottom: "1.75rem", padding: "1.5rem 1.75rem", borderRadius: 14, background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}>
                <Shield size={20} color="white" />
              </div>
              <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "hsl(213 31% 95%)" }}>Multi-Principal Central Administration</h2>
            </div>
            <p style={{ color: "hsl(215 16% 65%)", fontSize: "0.875rem", maxWidth: 680, lineHeight: 1.6 }}>
              Each Principal is linked to their specific <strong>School or College</strong>. Tap any Principal to inspect their isolated institution&apos;s students, teachers, classes, and fees in <strong>read-only oversight mode</strong>.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowAddModal(true); setAddError(""); }} id="admin-appoint-principal-btn" style={{ padding: "0.75rem 1.25rem", fontSize: "0.9rem" }}>
            <Plus size={18} /> Appoint New Principal
          </button>
        </div>

        {/* Metric Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "1.75rem" }}>
          {[
            { label: "Appointed Principals", value: stats.totalPrincipals, icon: Award, color: "#3b82f6", sub: "School / College Heads" },
            { label: "Total Students", value: stats.totalStudents, icon: Users, color: "#10b981", sub: "Across All Institutions" },
            { label: "Teaching Faculty", value: stats.totalTeachers, icon: UserCheck, color: "#a855f7", sub: "Faculty Staff" },
            { label: "Classes & Divisions", value: stats.totalClasses, icon: Building2, color: "#f59e0b", sub: "Academic Divisions" },
          ].map(card => (
            <div key={card.label} className="stat-card" style={{ borderColor: `${card.color}20` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem", border: `1px solid ${card.color}25` }}>
                <card.icon size={20} color={card.color} />
              </div>
              <div style={{ fontSize: "1.875rem", fontWeight: 800, color: "hsl(213 31% 91%)", lineHeight: 1 }}>{loading ? "—" : card.value}</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)", marginTop: "0.25rem" }}>{card.label}</div>
              <div style={{ fontSize: "0.7rem", color: `${card.color}aa`, marginTop: "0.25rem" }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="section-header">
          <div>
            <h3 className="section-title">Principals & Campuses Directory</h3>
            <p className="section-subtitle">Click any Principal to view their institution&apos;s segregated students and staff</p>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="search-box">
            <Search size={15} color="hsl(215 16% 47%)" />
            <input type="text" placeholder="Search by principal name, school/college, email..." value={search} onChange={e => setSearch(e.target.value)} id="admin-principal-search" />
          </div>
          <span style={{ fontSize: "0.8rem", color: "hsl(215 16% 47%)" }}>{filtered.length} principal{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Principals Table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: "0.75rem", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>
              <div style={{ width: 32, height: 32, border: "3px solid hsl(var(--border))", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
              Loading principals...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Principal & Head</th>
                  <th>Assigned School / College</th>
                  <th>Contact Details</th>
                  <th>Institution Scale</th>
                  <th>Campus Inspection</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "hsl(215 16% 47%)" }}>
                      <Award size={32} style={{ margin: "0 auto 0.75rem", display: "block", opacity: 0.4 }} />
                      No principals found
                    </td>
                  </tr>
                ) : filtered.map(p => {
                  const isCurrent = p.id === currentUserId;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleSelectPrincipal(p.id)}
                      style={{ cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      id={`principal-row-${p.id}`}
                    >
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div className="avatar" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" }}>
                            {p.name[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span>{p.name}</span>
                              {isCurrent && <span className="badge badge-primary" style={{ fontSize: "0.6rem" }}>You</span>}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 47%)" }}>Principal & Campus Leader</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(6,182,212,0.12)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(6,182,212,0.2)" }}>
                            <GraduationCap size={14} color="#06b6d4" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "hsl(213 31% 92%)" }}>{p.schoolName || "Main Institution"}</div>
                            <div style={{ fontSize: "0.68rem", color: "hsl(215 16% 47%)" }}>Autonomous Campus</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <Mail size={12} color="hsl(215 16% 50%)" />
                          <span>{p.email}</span>
                        </div>
                        {p.phone && (
                          <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 47%)", display: "flex", alignItems: "center", gap: "0.375rem", marginTop: 2 }}>
                            <Phone size={12} color="hsl(215 16% 50%)" />
                            <span>{p.phone}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                          <span className="badge badge-primary" style={{ fontSize: "0.68rem" }}>{p.studentCount || 0} Students</span>
                          <span className="badge badge-accent" style={{ fontSize: "0.68rem" }}>{p.teacherCount || 0} Faculty</span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "#3b82f6", borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.06)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPrincipal(p.id);
                          }}
                        >
                          <Eye size={12} />
                          <span>Inspect Campus</span>
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "0.375rem 0.625rem", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.3)", background: "rgba(245, 158, 11, 0.08)" }}
                            onClick={() => {
                              setPasswordModalPrincipal(p);
                              setNewPassword("");
                              setPasswordMessage(null);
                            }}
                            title="Change or Reset Principal's Password"
                            id={`pw-principal-${p.id}`}
                          >
                            <Key size={14} />
                          </button>
                          {!isCurrent && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: "0.375rem 0.625rem" }}
                              onClick={() => handleDelete(p.id, p.name)}
                              id={`delete-principal-${p.id}`}
                              title="Remove Principal"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ─── READ-ONLY SEGREGATED SCHOOL / PRINCIPAL DETAILS MODAL ─── */}
        {selectedPrincipalId && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedPrincipalId(null)}>
            <div className="modal-content" style={{ maxWidth: 920, width: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: "1.75rem" }}>
              
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid hsl(216 34% 17%)", paddingBottom: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #3b82f6, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "1.25rem", boxShadow: "0 6px 16px rgba(59,130,246,0.3)" }}>
                    {schoolDetails?.principal?.name?.[0] || "P"}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "hsl(213 31% 95%)" }}>{schoolDetails?.principal?.name || "Loading..."}</h2>
                      <span className="badge badge-accent" style={{ fontSize: "0.65rem" }}>Principal</span>
                      <span className="badge badge-warning" style={{ fontSize: "0.65rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <Lock size={10} /> Read-Only Mode
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: 3 }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#06b6d4" }}>
                        🏫 {schoolDetails?.principal?.schoolName || "Autonomous Institution"}
                      </span>
                      <span style={{ color: "hsl(215 16% 40%)" }}>•</span>
                      <span style={{ fontSize: "0.78rem", color: "hsl(215 16% 55%)" }}>
                        {schoolDetails?.principal?.email} ({schoolDetails?.principal?.phone || "No phone"})
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedPrincipalId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 50%)", padding: 6, borderRadius: 6 }}>
                  <X size={22} />
                </button>
              </div>

              {detailsLoading || !schoolDetails ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>
                  <div style={{ width: 36, height: 36, border: "3px solid hsl(var(--border))", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
                  Loading institution details...
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                  
                  {/* Read-Only Notice */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1rem", borderRadius: 8, background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", marginBottom: "1rem", fontSize: "0.8rem", color: "#f59e0b" }}>
                    <Lock size={14} />
                    <span><strong>Segregated Campus Dossier:</strong> Viewing exclusive records for <strong>{schoolDetails.principal.schoolName}</strong>. All data is isolated and view-only.</span>
                  </div>

                  {/* Tab Navigation */}
                  <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid hsl(216 34% 17%)", paddingBottom: "0.75rem", marginBottom: "1.25rem", overflowX: "auto" }}>
                    {[
                      { id: "overview", label: "Campus Overview", icon: TrendingUp },
                      { id: "students", label: `Students (${schoolDetails.students.length})`, icon: Users },
                      { id: "teachers", label: `Faculty (${schoolDetails.teachers.length})`, icon: UserCheck },
                      { id: "classes", label: `Classes (${schoolDetails.classes.length})`, icon: Building2 },
                      { id: "fees", label: "Fee Collections", icon: DollarSign },
                      { id: "exams", label: `Exams (${schoolDetails.exams.length})`, icon: FileText },
                    ].map(tab => {
                      const isActive = activeDetailTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveDetailTab(tab.id as any)}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", borderRadius: 8,
                            background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
                            border: `1px solid ${isActive ? "rgba(59,130,246,0.3)" : "transparent"}`,
                            color: isActive ? "#3b82f6" : "hsl(215 16% 55%)",
                            fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s"
                          }}
                        >
                          <tab.icon size={14} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content Container */}
                  <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.5rem" }}>
                    
                    {/* 1. OVERVIEW TAB */}
                    {activeDetailTab === "overview" && (
                      <div>
                        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: "1.5rem" }}>
                          {[
                            { label: "Enrolled Students", value: schoolDetails.stats.totalStudents, icon: Users, color: "#10b981" },
                            { label: "Teaching Faculty", value: schoolDetails.stats.totalTeachers, icon: UserCheck, color: "#a855f7" },
                            { label: "Campus Attendance", value: `${schoolDetails.stats.attendanceRate}%`, icon: Calendar, color: "#3b82f6" },
                            { label: "Fees Collected", value: `₹${(schoolDetails.stats.feeSummary.paid / 1000).toFixed(0)}K`, icon: DollarSign, color: "#10b981" },
                            { label: "Pending Fees", value: `₹${(schoolDetails.stats.feeSummary.pending / 1000).toFixed(0)}K`, icon: DollarSign, color: "#f59e0b" },
                          ].map(s => (
                            <div key={s.label} className="stat-card" style={{ borderColor: `${s.color}20`, padding: "1rem" }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
                                <s.icon size={18} color={s.color} />
                              </div>
                              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "hsl(213 31% 91%)" }}>{s.value}</div>
                              <div style={{ fontSize: "0.75rem", color: "hsl(215 16% 50%)" }}>{s.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Recent Students & Teachers Preview */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid hsl(216 34% 17%)", borderRadius: 10, padding: "1rem" }}>
                            <h4 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <Users size={15} color="#10b981" /> Students ({schoolDetails.students.length})
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {schoolDetails.students.slice(0, 4).map(st => (
                                <div key={st.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem", padding: "0.375rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                  <div>
                                    <div style={{ fontWeight: 600, color: "hsl(213 31% 90%)" }}>{st.user.name}</div>
                                    <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 47%)" }}>{st.rollNumber} • {st.class ? `${st.class.name}-${st.class.section}` : "No Class"}</div>
                                  </div>
                                  <span className="badge badge-primary" style={{ fontSize: "0.65rem" }}>{st.gender}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid hsl(216 34% 17%)", borderRadius: 10, padding: "1rem" }}>
                            <h4 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <UserCheck size={15} color="#a855f7" /> Faculty ({schoolDetails.teachers.length})
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {schoolDetails.teachers.slice(0, 4).map(tc => (
                                <div key={tc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem", padding: "0.375rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                  <div>
                                    <div style={{ fontWeight: 600, color: "hsl(213 31% 90%)" }}>{tc.user.name}</div>
                                    <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 47%)" }}>{tc.department || "General"} • {tc.employeeId}</div>
                                  </div>
                                  <span className="badge badge-accent" style={{ fontSize: "0.65rem" }}>Faculty</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. STUDENTS TAB (READ-ONLY) */}
                    {activeDetailTab === "students" && (
                      <table className="data-table" style={{ fontSize: "0.8rem" }}>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Roll Number</th>
                            <th>Class & Section</th>
                            <th>Gender</th>
                            <th>Parent Details</th>
                            <th>Admission Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schoolDetails.students.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>No students enrolled under this institution.</td></tr>
                          ) : schoolDetails.students.map(st => (
                            <tr key={st.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: "hsl(213 31% 90%)" }}>{st.user.name}</div>
                                <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 47%)" }}>{st.user.email}</div>
                              </td>
                              <td><span className="badge badge-primary">{st.rollNumber}</span></td>
                              <td>{st.class ? `${st.class.name} - ${st.class.section}` : "—"}</td>
                              <td><span className="badge badge-accent">{st.gender}</span></td>
                              <td>
                                <div>{st.parentName || "—"}</div>
                                <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 47%)" }}>{st.parentPhone || ""}</div>
                              </td>
                              <td>{format(new Date(st.admissionDate), "MMM d, yyyy")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* 3. TEACHERS TAB (READ-ONLY) */}
                    {activeDetailTab === "teachers" && (
                      <table className="data-table" style={{ fontSize: "0.8rem" }}>
                        <thead>
                          <tr>
                            <th>Faculty Member</th>
                            <th>Employee ID</th>
                            <th>Department</th>
                            <th>Academic Qualification</th>
                            <th>Assigned Classes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schoolDetails.teachers.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>No faculty records found for this institution.</td></tr>
                          ) : schoolDetails.teachers.map(tc => (
                            <tr key={tc.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: "hsl(213 31% 90%)" }}>{tc.user.name}</div>
                                <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 47%)" }}>{tc.user.email}</div>
                              </td>
                              <td><span className="badge badge-accent">{tc.employeeId}</span></td>
                              <td>{tc.department || "General"}</td>
                              <td>{tc.qualification || "—"}</td>
                              <td>
                                {tc.classes.length > 0 ? (
                                  tc.classes.map(c => `${c.name}-${c.section}`).join(", ")
                                ) : <span style={{ color: "hsl(215 16% 40%)" }}>None</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* 4. CLASSES TAB (READ-ONLY) */}
                    {activeDetailTab === "classes" && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                        {schoolDetails.classes.length === 0 ? (
                          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "hsl(215 16% 50%)" }}>No classes configured for this institution.</div>
                        ) : schoolDetails.classes.map(cl => (
                          <div key={cl.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: 10, padding: "1.25rem" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "hsl(213 31% 95%)" }}>{cl.name} - {cl.section}</div>
                              <span className="badge badge-primary">{cl.academicYear}</span>
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)", marginBottom: "0.5rem" }}>
                              Class Teacher: <strong style={{ color: "hsl(213 31% 85%)" }}>{cl.teacher?.user?.name || "Unassigned"}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "0.75rem" }}>
                              <span>Enrolled: <strong>{cl.students.length} students</strong></span>
                              <span>Subjects: <strong>{cl.subjects.length}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 5. FEES TAB (READ-ONLY) */}
                    {activeDetailTab === "fees" && (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
                          <div style={{ padding: "0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)" }}>
                            <div style={{ fontSize: "0.7rem", color: "hsl(215 16% 50%)" }}>Total Billed</div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "hsl(213 31% 90%)" }}>₹{schoolDetails.stats.feeSummary.total.toLocaleString()}</div>
                          </div>
                          <div style={{ padding: "0.75rem", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <div style={{ fontSize: "0.7rem", color: "#10b981" }}>Collected</div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10b981" }}>₹{schoolDetails.stats.feeSummary.paid.toLocaleString()}</div>
                          </div>
                          <div style={{ padding: "0.75rem", borderRadius: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                            <div style={{ fontSize: "0.7rem", color: "#f59e0b" }}>Pending</div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f59e0b" }}>₹{schoolDetails.stats.feeSummary.pending.toLocaleString()}</div>
                          </div>
                          <div style={{ padding: "0.75rem", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <div style={{ fontSize: "0.7rem", color: "#ef4444" }}>Overdue</div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ef4444" }}>₹{schoolDetails.stats.feeSummary.overdue.toLocaleString()}</div>
                          </div>
                        </div>

                        <table className="data-table" style={{ fontSize: "0.8rem" }}>
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th>Fee Type</th>
                              <th>Amount</th>
                              <th>Due Date</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schoolDetails.fees.slice(0, 10).map(f => (
                              <tr key={f.id}>
                                <td style={{ fontWeight: 600 }}>{f.student.user.name}</td>
                                <td>{f.type}</td>
                                <td style={{ fontWeight: 700 }}>₹{f.amount.toLocaleString()}</td>
                                <td>{format(new Date(f.dueDate), "MMM d, yyyy")}</td>
                                <td>
                                  <span className={`badge ${f.status === "PAID" ? "badge-success" : f.status === "PENDING" ? "badge-warning" : "badge-danger"}`}>
                                    {f.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 6. EXAMS TAB (READ-ONLY) */}
                    {activeDetailTab === "exams" && (
                      <table className="data-table" style={{ fontSize: "0.8rem" }}>
                        <thead>
                          <tr>
                            <th>Exam Name</th>
                            <th>Class</th>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Total Marks</th>
                            <th>Exam Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schoolDetails.exams.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>No exams scheduled for this campus.</td></tr>
                          ) : schoolDetails.exams.map(ex => (
                            <tr key={ex.id}>
                              <td style={{ fontWeight: 600, color: "hsl(213 31% 90%)" }}>{ex.name}</td>
                              <td>{ex.class.name} - {ex.class.section}</td>
                              <td>{ex.subject.name}</td>
                              <td>{format(new Date(ex.date), "MMM d, yyyy")}</td>
                              <td><span className="badge badge-primary">{ex.totalMarks} Marks</span></td>
                              <td><span className="badge badge-accent">{ex.type}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── ADD PRINCIPAL MODAL ─── */}
        {showAddModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
            <div className="modal-content" style={{ maxWidth: 480 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shield size={18} color="#3b82f6" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Appoint New Principal</h3>
                    <p style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>Assign school/college authority and credentials</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)", padding: 4 }}><X size={20} /></button>
              </div>

              {addError && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: 8, background: "hsla(355,78%,60%,0.1)", border: "1px solid hsla(355,78%,60%,0.25)", marginBottom: "1rem", fontSize: "0.85rem", color: "hsl(355 78% 70%)" }}>
                  <AlertCircle size={16} />
                  <span>{addError}</span>
                </div>
              )}

              <form onSubmit={handleAddPrincipal} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Principal Full Name *</label>
                  <input className="form-input" placeholder="Dr. Rameshwar Sharma, Ph.D." required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} id="principal-name-input" />
                </div>

                <div>
                  <label className="form-label">School / College Name *</label>
                  <input className="form-input" placeholder="National Public School, Indiranagar" required value={form.schoolName} onChange={e => setForm(f => ({ ...f, schoolName: e.target.value }))} id="principal-school-input" />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-input" placeholder="rameshwar.sharma@edumanage.com" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} id="principal-email-input" />
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-input" placeholder="+91-98450-11221" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} id="principal-phone-input" />
                </div>

                <div>
                  <label className="form-label">Initial Password</label>
                  <input className="form-input" placeholder="principal123" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} id="principal-password-input" />
                  <p style={{ fontSize: "0.72rem", color: "hsl(215 16% 47%)", marginTop: 4 }}>Default initial password is <strong>principal123</strong>.</p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={saving} id="save-principal-btn">
                    {saving ? "Appointing..." : "Appoint Principal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── CHANGE / RESET PRINCIPAL PASSWORD MODAL ─── */}
        {passwordModalPrincipal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPasswordModalPrincipal(null)}>
            <div className="modal-content" style={{ maxWidth: 440 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Key size={18} color="#f59e0b" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, color: "hsl(213 31% 91%)" }}>Manage Principal Password</h3>
                    <p style={{ fontSize: "0.75rem", color: "hsl(215 16% 47%)" }}>{passwordModalPrincipal.name} ({passwordModalPrincipal.schoolName})</p>
                  </div>
                </div>
                <button onClick={() => setPasswordModalPrincipal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)", padding: 4 }}><X size={20} /></button>
              </div>

              {passwordMessage && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderRadius: 8, background: passwordMessage.type === "success" ? "rgba(16,185,129,0.1)" : "hsla(355,78%,60%,0.1)", border: `1px solid ${passwordMessage.type === "success" ? "rgba(16,185,129,0.3)" : "hsla(355,78%,60%,0.25)"}`, marginBottom: "1rem", fontSize: "0.85rem", color: passwordMessage.type === "success" ? "#10b981" : "hsl(355 78% 70%)" }}>
                  {passwordMessage.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="form-label">Set Custom Password</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    id="principal-new-pw-input"
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ justifyContent: "center" }}
                  disabled={passwordSaving || newPassword.length < 6}
                  onClick={() => handleAdminPasswordChange(false)}
                  id="save-principal-pw-btn"
                >
                  {passwordSaving ? "Updating..." : "Set New Password"}
                </button>

                <div style={{ position: "relative", textAlign: "center", margin: "0.5rem 0" }}>
                  <div style={{ borderTop: "1px solid hsl(216 34% 17%)", position: "absolute", top: "50%", width: "100%" }} />
                  <span style={{ position: "relative", background: "hsl(222 47% 10%)", padding: "0 0.5rem", fontSize: "0.72rem", color: "hsl(215 16% 47%)" }}>OR</span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: "center", borderColor: "rgba(245, 158, 11, 0.3)", color: "#f59e0b" }}
                  disabled={passwordSaving}
                  onClick={() => handleAdminPasswordChange(true)}
                  id="reset-principal-default-pw-btn"
                >
                  ⚡ Reset to Default (principal123)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
