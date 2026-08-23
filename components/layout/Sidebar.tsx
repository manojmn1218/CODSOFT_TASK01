"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  GraduationCap, LayoutDashboard, Users, UserCheck, BookOpen, ClipboardList,
  DollarSign, Megaphone, LogOut, ChevronRight, BookMarked, FileText, Calendar, ShieldCheck
} from "lucide-react";

// Major Super Admin (manojmn1218@gmail.com) exclusive navigation (ONLY Principals Hub)
const superAdminNav = [
  { href: "/admin", label: "Principals Hub", icon: ShieldCheck },
];

// School Principal navigation (school-level operations without Principals Hub)
const principalNav = [
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: UserCheck },
  { href: "/admin/classes", label: "Classes", icon: BookOpen },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/admin/exams", label: "Examinations", icon: FileText },
  { href: "/admin/fees", label: "Fees", icon: DollarSign },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

const teacherNav = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/students", label: "Students", icon: Users },
  { href: "/teacher/classes", label: "My Classes", icon: BookOpen },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/teacher/results", label: "Exam Results", icon: FileText },
  { href: "/teacher/announcements", label: "Announcements", icon: Megaphone },
];

const studentNav = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/attendance", label: "Attendance", icon: Calendar },
  { href: "/student/results", label: "My Results", icon: BookMarked },
  { href: "/student/fees", label: "Fee Status", icon: DollarSign },
  { href: "/student/announcements", label: "Announcements", icon: Megaphone },
];

const roleColors: Record<string, string> = {
  ADMIN: "#3b82f6",
  PRINCIPAL: "#06b6d4",
  TEACHER: "#a855f7",
  STUDENT: "#10b981",
};

const roleBadgeStyles: Record<string, React.CSSProperties> = {
  ADMIN: { background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.3)" },
  PRINCIPAL: { background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)" },
  TEACHER: { background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" },
  STUDENT: { background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" },
};

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as { role?: string })?.role || "";
  const email = (session?.user as { email?: string })?.email || "";

  const isMajorAdmin = email === "manojmn1218@gmail.com" || role === "ADMIN";

  const navItems = isMajorAdmin
    ? superAdminNav
    : role === "PRINCIPAL"
    ? principalNav
    : role === "TEACHER"
    ? teacherNav
    : studentNav;

  const accentColor = isMajorAdmin ? "#3b82f6" : roleColors[role] || "#3b82f6";
  const displayRole = isMajorAdmin ? "MAJOR ADMIN" : role;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${accentColor}40` }}>
          <GraduationCap size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.15rem", color: "#ffffff", letterSpacing: "-0.01em" }}>EduManage</div>
          <div style={{ fontSize: "0.65rem", color: "hsl(215 16% 55%)", fontWeight: 500 }}>Academic Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div style={{ fontSize: "0.65rem", color: "hsl(215 16% 40%)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 0.5rem", marginBottom: "0.5rem" }}>
          {isMajorAdmin ? "Admin Control" : "Navigation"}
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/admin" && href !== "/teacher" && href !== "/student" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${isActive ? "active" : ""}`} style={isActive ? { color: accentColor } : {}}>
              <Icon size={17} />
              <span>{label}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid hsl(216 34% 17%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.04)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${accentColor}80, #8b5cf680)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem", color: accentColor, flexShrink: 0, border: `1px solid ${accentColor}30` }}>
            {session?.user?.name?.[0] || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "hsl(213 31% 88%)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session?.user?.name}</div>
            <div style={{ ...roleBadgeStyles[isMajorAdmin ? "ADMIN" : role], fontSize: "0.6rem", fontWeight: 700, display: "inline-block", padding: "1px 6px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>
              {displayRole}
            </div>
            {!isMajorAdmin && (session?.user as any)?.schoolName && (
              <div style={{ fontSize: "0.65rem", color: "#93c5fd", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2, fontWeight: 500 }} title={(session?.user as any).schoolName}>
                {(session?.user as any).schoolName}
              </div>
            )}
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 45%)", padding: "4px", borderRadius: 6, transition: "all 0.15s" }} title="Sign out" id="signout-btn"
            onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "hsl(215 16% 45%)"; e.currentTarget.style.background = "none"; }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
