"use client";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/layout/TopBar";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import {
  GraduationCap,
  Users,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Plus,
  X,
  Search,
  Filter,
  Check,
  Building,
  School,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ListFilter,
} from "lucide-react";

interface StudentAttendance {
  id: string;
  studentId: string;
  date: string;
  status: string;
  note?: string | null;
  student: {
    id: string;
    rollNumber: string;
    schoolName?: string;
    user: { name: string; schoolName?: string };
  };
  class: { id: string; name: string; section: string; schoolName?: string };
}

interface TeacherAttendance {
  id: string;
  teacherId: string;
  date: string;
  status: string;
  note?: string | null;
  checkInTime?: string | null;
  schoolName?: string;
  teacher: {
    id: string;
    employeeId: string;
    department?: string | null;
    qualification?: string | null;
    schoolName?: string;
    user: { name: string; email: string; phone?: string | null; schoolName?: string };
  };
}

interface ClassItem {
  id: string;
  name: string;
  section: string;
  schoolName?: string;
}

interface TeacherItem {
  id: string;
  employeeId: string;
  department?: string | null;
  schoolName?: string;
  user: { name: string; email: string; schoolName?: string };
}

interface StudentItem {
  id: string;
  rollNumber: string;
  schoolName?: string;
  user: { name: string; schoolName?: string };
  classId?: string | null;
  class?: { name: string; section: string };
}

interface PrincipalItem {
  id: string;
  name: string;
  email: string;
  schoolName?: string;
}

export default function AdminAttendancePage() {
  const { data: session } = useSession();
  const currentUserEmail = session?.user?.email || "";
  const userSchool = (session?.user as any)?.schoolName || "";
  const isMajorAdmin = currentUserEmail === "manojmn1218@gmail.com";

  // Tab: Student vs Teacher
  const [activeTab, setActiveTab] = useState<"STUDENT" | "TEACHER">("STUDENT");

  // View Mode: Date Matrix Register vs Single Day Roster
  const [viewMode, setViewMode] = useState<"MATRIX" | "SINGLE_DAY">("MATRIX");

  // Active Month & Active Single Day
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedSingleDate, setSelectedSingleDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  // Institution / School Filter State
  const [schoolsList, setSchoolsList] = useState<string[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");

  // Raw Database Records
  const [studentRecords, setStudentRecords] = useState<StudentAttendance[]>([]);
  const [teacherRecords, setTeacherRecords] = useState<TeacherAttendance[]>([]);
  const [studentClasses, setStudentClasses] = useState<ClassItem[]>([]);
  const [teachersList, setTeachersList] = useState<TeacherItem[]>([]);
  const [studentsList, setStudentsList] = useState<StudentItem[]>([]);

  // Filters
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Loading & Saving
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mark Modals
  const [showMarkStudentModal, setShowMarkStudentModal] = useState(false);
  const [showMarkTeacherModal, setShowMarkTeacherModal] = useState(false);

  // Mark Forms
  const [markStudentClassId, setMarkStudentClassId] = useState<string>("");
  const [markStudentDate, setMarkStudentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [studentAttendanceForm, setStudentAttendanceForm] = useState<Record<string, { status: string; note: string }>>({});

  const [markTeacherDate, setMarkTeacherDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [teacherAttendanceForm, setTeacherAttendanceForm] = useState<Record<string, { status: string; checkInTime: string; note: string }>>({});

  // 1. Fetch Principals to get list of schools (only if Major Admin or schoolName unknown)
  useEffect(() => {
    async function initSchools() {
      try {
        // Direct session fetch to guarantee instant schoolName hydration
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const currentSchool = sessionData?.user?.schoolName || userSchool;
        const currentEmail = sessionData?.user?.email || currentUserEmail;
        const isAdmin = currentEmail === "manojmn1218@gmail.com";

        if (!isAdmin && currentSchool) {
          setSelectedSchool(currentSchool);
          loadSchoolAttendanceData(currentSchool);
          return;
        }

        const res = await fetch("/api/principals");
        if (res.ok) {
          const data = await res.json();
          const pList: PrincipalItem[] = data.principals || [];
          const uniqueSchools = Array.from(new Set(pList.map(p => p.schoolName).filter(Boolean))) as string[];
          setSchoolsList(uniqueSchools);

          if (isAdmin) {
            const initialSchool = selectedSchool || uniqueSchools[0] || "";
            setSelectedSchool(initialSchool);
            loadSchoolAttendanceData(initialSchool);
          } else if (currentSchool) {
            setSelectedSchool(currentSchool);
            loadSchoolAttendanceData(currentSchool);
          } else if (uniqueSchools.length > 0) {
            setSelectedSchool(uniqueSchools[0]);
            loadSchoolAttendanceData(uniqueSchools[0]);
          }
        }
      } catch {
        // ignore
      }
    }
    initSchools();
  }, [userSchool, currentUserEmail, isMajorAdmin]);

  async function loadSchoolAttendanceData(schoolName?: string) {
    setLoading(true);
    const targetSchool = isMajorAdmin ? (schoolName || selectedSchool) : (userSchool || schoolName);
    const query = isMajorAdmin && targetSchool ? `?schoolName=${encodeURIComponent(targetSchool)}` : "";
    try {
      const [stAttRes, tcAttRes, clsRes, tcListRes, stListRes] = await Promise.all([
        fetch(`/api/attendance${query}`),
        fetch(`/api/attendance/teacher${query}`),
        fetch(`/api/classes${query}`),
        fetch(`/api/teachers${query}`),
        fetch(`/api/students${query}`),
      ]);

      const stAtt = await stAttRes.json();
      const tcAtt = await tcAttRes.json();
      const cls = await clsRes.json();
      const tcList = await tcListRes.json();
      const stList = await stListRes.json();

      setStudentRecords(Array.isArray(stAtt) ? stAtt : []);
      setTeacherRecords(Array.isArray(tcAtt) ? tcAtt : []);
      setStudentClasses(Array.isArray(cls) ? cls : []);
      setTeachersList(Array.isArray(tcList) ? tcList : []);
      setStudentsList(Array.isArray(stList) ? stList : []);

      if (cls.length > 0) {
        setMarkStudentClassId(cls[0].id);
      }
      setSelectedClassFilter("ALL");
      setSelectedDeptFilter("ALL");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  // --- Dates in the Selected Month ---
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Working days (excluding weekends or show all)
  const monthDays = useMemo(() => {
    return daysInMonth;
  }, [daysInMonth]);

  // --- Student Attendance Matrix Mapping ---
  // Map: studentId -> dateString (yyyy-MM-dd) -> Attendance Record
  const studentAttendanceMap = useMemo(() => {
    const map = new Map<string, Map<string, StudentAttendance>>();
    studentRecords.forEach(rec => {
      const sId = rec.studentId || rec.student?.id;
      if (!sId) return;
      if (!map.has(sId)) {
        map.set(sId, new Map());
      }
      const dStr = format(new Date(rec.date), "yyyy-MM-dd");
      map.get(sId)!.set(dStr, rec);
    });
    return map;
  }, [studentRecords]);

  // --- Teacher Attendance Matrix Mapping ---
  // Map: teacherId -> dateString (yyyy-MM-dd) -> Teacher Attendance Record
  const teacherAttendanceMap = useMemo(() => {
    const map = new Map<string, Map<string, TeacherAttendance>>();
    teacherRecords.forEach(rec => {
      const tId = rec.teacherId || rec.teacher?.id;
      if (!tId) return;
      if (!map.has(tId)) {
        map.set(tId, new Map());
      }
      const dStr = format(new Date(rec.date), "yyyy-MM-dd");
      map.get(tId)!.set(dStr, rec);
    });
    return map;
  }, [teacherRecords]);

  // Filtered Students Roster
  const filteredStudents = useMemo(() => {
    return studentsList.filter(s => {
      const matchClass =
        selectedClassFilter === "ALL" ||
        s.classId === selectedClassFilter ||
        (s.class && `${s.class.name} - ${s.class.section}` === selectedClassFilter);
      const matchSearch =
        !searchQuery ||
        s.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [studentsList, selectedClassFilter, searchQuery]);

  // Filtered Teachers Roster
  const departments = useMemo(() => {
    return Array.from(new Set(teachersList.map(t => t.department).filter(Boolean))) as string[];
  }, [teachersList]);

  const filteredTeachers = useMemo(() => {
    return teachersList.filter(t => {
      const matchDept = selectedDeptFilter === "ALL" || t.department === selectedDeptFilter;
      const matchSearch =
        !searchQuery ||
        t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.department && t.department.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchDept && matchSearch;
    });
  }, [teachersList, selectedDeptFilter, searchQuery]);

  // --- Handlers for Marking Student Attendance ---
  function openStudentMarkModal(targetDate?: string) {
    const d = targetDate || selectedSingleDate || format(new Date(), "yyyy-MM-dd");
    setMarkStudentDate(d);

    const defaultClassId = selectedClassFilter !== "ALL" ? selectedClassFilter : (studentClasses[0]?.id || "");
    setMarkStudentClassId(defaultClassId);

    const relevantStudents = studentsList.filter(s => !defaultClassId || s.classId === defaultClassId);
    const initialMap: Record<string, { status: string; note: string }> = {};

    relevantStudents.forEach(s => {
      const existing = studentAttendanceMap.get(s.id)?.get(d);
      initialMap[s.id] = {
        status: existing?.status || "PRESENT",
        note: existing?.note || "",
      };
    });
    setStudentAttendanceForm(initialMap);
    setShowMarkStudentModal(true);
  }

  function handleClassChangeInModal(newClassId: string) {
    setMarkStudentClassId(newClassId);
    const relevantStudents = studentsList.filter(s => !newClassId || s.classId === newClassId);
    const updatedMap: Record<string, { status: string; note: string }> = {};
    relevantStudents.forEach(s => {
      const existing = studentAttendanceMap.get(s.id)?.get(markStudentDate);
      updatedMap[s.id] = studentAttendanceForm[s.id] || {
        status: existing?.status || "PRESENT",
        note: existing?.note || "",
      };
    });
    setStudentAttendanceForm(updatedMap);
  }

  function markAllStudents(status: "PRESENT" | "ABSENT") {
    const updated = { ...studentAttendanceForm };
    Object.keys(updated).forEach(k => {
      updated[k] = { ...updated[k], status };
    });
    setStudentAttendanceForm(updated);
  }

  async function submitStudentAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!markStudentClassId) return;

    setSaving(true);
    const records = Object.entries(studentAttendanceForm).map(([studentId, data]) => ({
      studentId,
      classId: markStudentClassId,
      date: markStudentDate,
      status: data.status,
      note: data.note || undefined,
    }));

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      if (res.ok) {
        setShowMarkStudentModal(false);
        await loadSchoolAttendanceData(selectedSchool);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  // --- Handlers for Marking Teacher Attendance ---
  function openTeacherMarkModal(targetDate?: string) {
    const d = targetDate || selectedSingleDate || format(new Date(), "yyyy-MM-dd");
    setMarkTeacherDate(d);

    const initialMap: Record<string, { status: string; checkInTime: string; note: string }> = {};
    teachersList.forEach(t => {
      const existing = teacherAttendanceMap.get(t.id)?.get(d);
      initialMap[t.id] = {
        status: existing?.status || "PRESENT",
        checkInTime: existing?.checkInTime || (existing?.status === "PRESENT" || !existing ? "08:45 AM" : ""),
        note: existing?.note || "",
      };
    });
    setTeacherAttendanceForm(initialMap);
    setShowMarkTeacherModal(true);
  }

  function markAllTeachers(status: "PRESENT" | "ON_LEAVE") {
    const updated = { ...teacherAttendanceForm };
    Object.keys(updated).forEach(k => {
      updated[k] = {
        ...updated[k],
        status,
        checkInTime: status === "PRESENT" ? "08:45 AM" : "",
      };
    });
    setTeacherAttendanceForm(updated);
  }

  async function submitTeacherAttendance(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const records = Object.entries(teacherAttendanceForm).map(([teacherId, data]) => ({
      teacherId,
      date: markTeacherDate,
      status: data.status,
      checkInTime: data.checkInTime || undefined,
      note: data.note || undefined,
    }));

    try {
      const res = await fetch("/api/attendance/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      if (res.ok) {
        setShowMarkTeacherModal(false);
        await loadSchoolAttendanceData(selectedSchool);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  // --- KPI Calculation for Month / Scope ---
  const overallStudentStats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let totalLogs = 0;

    studentRecords.forEach(r => {
      const d = new Date(r.date);
      if (d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()) {
        totalLogs++;
        if (r.status === "PRESENT") presentCount++;
        else if (r.status === "ABSENT") absentCount++;
        else if (r.status === "LATE") lateCount++;
      }
    });

    const rate = totalLogs > 0 ? Math.round((presentCount / totalLogs) * 100) : 100;
    return { totalLogs, presentCount, absentCount, lateCount, rate };
  }, [studentRecords, currentMonth]);

  const overallTeacherStats = useMemo(() => {
    let presentCount = 0;
    let leaveCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let totalLogs = 0;

    teacherRecords.forEach(r => {
      const d = new Date(r.date);
      if (d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()) {
        totalLogs++;
        if (r.status === "PRESENT") presentCount++;
        else if (r.status === "ON_LEAVE") leaveCount++;
        else if (r.status === "ABSENT") absentCount++;
        else if (r.status === "LATE") lateCount++;
      }
    });

    const rate = totalLogs > 0 ? Math.round((presentCount / totalLogs) * 100) : 100;
    return { totalLogs, presentCount, leaveCount, absentCount, lateCount, rate };
  }, [teacherRecords, currentMonth]);

  // Helper cell renderer for matrix date cell
  const renderCellStatus = (status?: string, isWeekendDay?: boolean) => {
    if (!status) {
      if (isWeekendDay) {
        return <span style={{ color: "hsl(215 16% 35%)", fontSize: "0.7rem" }}>OFF</span>;
      }
      return <span style={{ color: "hsl(215 16% 30%)", fontSize: "0.8rem" }}>—</span>;
    }

    switch (status) {
      case "PRESENT":
        return (
          <span
            title="Present"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(16,185,129,0.2)",
              color: "#34d399",
              border: "1px solid rgba(16,185,129,0.4)",
              fontWeight: 800,
              fontSize: "0.7rem",
            }}
          >
            P
          </span>
        );
      case "ABSENT":
        return (
          <span
            title="Absent"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.2)",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.4)",
              fontWeight: 800,
              fontSize: "0.7rem",
            }}
          >
            A
          </span>
        );
      case "ON_LEAVE":
        return (
          <span
            title="On Leave"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(59,130,246,0.2)",
              color: "#93c5fd",
              border: "1px solid rgba(59,130,246,0.4)",
              fontWeight: 800,
              fontSize: "0.68rem",
            }}
          >
            L
          </span>
        );
      case "LATE":
        return (
          <span
            title="Late"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(245,158,11,0.2)",
              color: "#fbbf24",
              border: "1px solid rgba(245,158,11,0.4)",
              fontWeight: 800,
              fontSize: "0.7rem",
            }}
          >
            T
          </span>
        );
      default:
        return <span style={{ fontSize: "0.7rem" }}>{status[0]}</span>;
    }
  };

  return (
    <div>
      <TopBar title="Institutional Attendance Register" subtitle="Date-wise attendance matrix and daily registers per campus" />

      <div className="page-container">
        
        {/* ─── INSTITUTION FOCUS HEADER & SWITCHER ─── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))",
            border: "1px solid rgba(59,130,246,0.25)",
            borderRadius: "0.875rem",
            padding: "1rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
              }}
            >
              <School size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 55%)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Campus Register Focus
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "hsl(213 31% 95%)" }}>
                {selectedSchool || "Autonomous Campus"}
              </div>
            </div>
          </div>

          {isMajorAdmin ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <span style={{ fontSize: "0.8rem", color: "hsl(215 16% 65%)", fontWeight: 600 }}>Switch Campus:</span>
              <select
                className="form-input"
                style={{
                  height: 38,
                  background: "rgba(15,23,42,0.8)",
                  borderColor: "rgba(59,130,246,0.4)",
                  fontWeight: 600,
                  color: "#93c5fd",
                  cursor: "pointer",
                }}
                value={selectedSchool}
                onChange={e => setSelectedSchool(e.target.value)}
              >
                {schoolsList.map(s => (
                  <option key={s} value={s}>
                    🏫 {s}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", padding: "0.4rem 0.85rem", borderRadius: 8 }}>
              <ShieldCheck size={16} color="#10b981" />
              <span style={{ fontSize: "0.8rem", color: "#34d399", fontWeight: 700 }}>Campus Scoped View</span>
            </div>
          )}
        </div>

        {/* ─── ROLE TABS + VIEW MODE TOGGLE ─── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", borderBottom: "1px solid hsl(216 34% 17%)", paddingBottom: "0.75rem" }}>
          
          {/* Main Role Tabs */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setActiveTab("STUDENT")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.625rem 1.15rem",
                borderRadius: "0.625rem",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeTab === "STUDENT" ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))" : "transparent",
                color: activeTab === "STUDENT" ? "#60a5fa" : "hsl(215 16% 55%)",
                border: activeTab === "STUDENT" ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
              }}
            >
              <GraduationCap size={18} />
              <span>🎓 Student Register</span>
              <span style={{ fontSize: "0.72rem", background: "rgba(59,130,246,0.2)", color: "#93c5fd", padding: "2px 7px", borderRadius: 10 }}>
                {filteredStudents.length} Students
              </span>
            </button>

            <button
              onClick={() => setActiveTab("TEACHER")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.625rem 1.15rem",
                borderRadius: "0.625rem",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeTab === "TEACHER" ? "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))" : "transparent",
                color: activeTab === "TEACHER" ? "#c084fc" : "hsl(215 16% 55%)",
                border: activeTab === "TEACHER" ? "1px solid rgba(168,85,247,0.4)" : "1px solid transparent",
              }}
            >
              <Users size={18} />
              <span>🧑‍🏫 Faculty Register</span>
              <span style={{ fontSize: "0.72rem", background: "rgba(168,85,247,0.2)", color: "#e9d5ff", padding: "2px 7px", borderRadius: 10 }}>
                {filteredTeachers.length} Faculty
              </span>
            </button>
          </div>

          {/* View Mode Toggle: Date Matrix vs Single Day View */}
          <div style={{ display: "flex", background: "rgba(15,23,42,0.6)", padding: "3px", borderRadius: "0.5rem", border: "1px solid hsl(216 34% 17%)" }}>
            <button
              type="button"
              onClick={() => setViewMode("MATRIX")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "0.375rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                background: viewMode === "MATRIX" ? "rgba(59,130,246,0.3)" : "transparent",
                color: viewMode === "MATRIX" ? "#93c5fd" : "hsl(215 16% 55%)",
              }}
            >
              <CalendarDays size={14} /> Month Matrix (All Dates)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("SINGLE_DAY")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "0.375rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                background: viewMode === "SINGLE_DAY" ? "rgba(59,130,246,0.3)" : "transparent",
                color: viewMode === "SINGLE_DAY" ? "#93c5fd" : "hsl(215 16% 55%)",
              }}
            >
              <CalendarIcon size={14} /> Single Date Roster
            </button>
          </div>
        </div>

        {/* ─── DATE & MONTH CONTROLS ROW ─── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          
          {/* Month or Date Selector */}
          {viewMode === "MATRIX" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.03)", padding: "0.35rem 0.75rem", borderRadius: "0.625rem", border: "1px solid hsl(216 34% 17%)" }}>
              <button
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.5rem" }}
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "hsl(213 31% 95%)", minWidth: 140, textAlign: "center" }}>
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.5rem" }}
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", marginLeft: "0.5rem" }}
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "hsl(215 16% 60%)", fontWeight: 600 }}>Select Attendance Date:</span>
              <input
                type="date"
                className="form-input"
                style={{ height: 38, width: 170 }}
                value={selectedSingleDate}
                onChange={e => setSelectedSingleDate(e.target.value)}
              />
            </div>
          )}

          {/* Search and Filters */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", minWidth: 200 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "hsl(215 16% 47%)" }} />
              <input
                type="text"
                className="form-input"
                placeholder={activeTab === "STUDENT" ? "Search student or roll..." : "Search professor..."}
                style={{ paddingLeft: 32, height: 36, fontSize: "0.85rem" }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Division or Dept Filter */}
            {activeTab === "STUDENT" ? (
              <select
                className="form-input"
                style={{ height: 36, fontSize: "0.85rem", padding: "0 8px" }}
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
              >
                <option value="ALL">All Divisions ({selectedSchool || "Campus"})</option>
                {studentClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.section})
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="form-input"
                style={{ height: 36, fontSize: "0.85rem", padding: "0 8px" }}
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}

            {/* Mark Action Button */}
            {activeTab === "STUDENT" ? (
              <button className="btn btn-primary" onClick={() => openStudentMarkModal()} style={{ height: 36, gap: "0.4rem" }}>
                <Plus size={15} /> Mark Student Attendance
              </button>
            ) : (
              <button className="btn btn-accent" onClick={() => openTeacherMarkModal()} style={{ height: 36, gap: "0.4rem", background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none" }}>
                <Plus size={15} /> Mark Faculty Attendance
              </button>
            )}
          </div>
        </div>

        {/* ─── MONTHLY STATS SUMMARY ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.875rem", marginBottom: "1.5rem" }}>
          {activeTab === "STUDENT" ? (
            [
              { label: `${format(currentMonth, "MMM")} Logs`, value: overallStudentStats.totalLogs, color: "#3b82f6" },
              { label: "Present Marked", value: overallStudentStats.presentCount, color: "#10b981" },
              { label: "Absent Marked", value: overallStudentStats.absentCount, color: "#ef4444" },
              { label: "Late Arrivals", value: overallStudentStats.lateCount, color: "#f59e0b" },
              { label: "Attendance %", value: `${overallStudentStats.rate}%`, color: "#8b5cf6" },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ padding: "1rem", borderColor: `${s.color}25` }}>
                <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 55%)", fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: "1.45rem", fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
              </div>
            ))
          ) : (
            [
              { label: `${format(currentMonth, "MMM")} Logs`, value: overallTeacherStats.totalLogs, color: "#a855f7" },
              { label: "Faculty Present", value: overallTeacherStats.presentCount, color: "#10b981" },
              { label: "Approved Leave", value: overallTeacherStats.leaveCount, color: "#3b82f6" },
              { label: "Faculty Absent", value: overallTeacherStats.absentCount, color: "#ef4444" },
              { label: "Faculty Presence %", value: `${overallTeacherStats.rate}%`, color: "#ec4899" },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ padding: "1rem", borderColor: `${s.color}25` }}>
                <div style={{ fontSize: "0.72rem", color: "hsl(215 16% 55%)", fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: "1.45rem", fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
              </div>
            ))
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ─── VIEW 1: DATE MATRIX REGISTER (ALL DATES ACROSS COLUMNS) ─── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === "MATRIX" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: "0.75rem", overflowX: "auto" }}>
            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>Loading attendance register...</div>
            ) : activeTab === "STUDENT" ? (
              /* STUDENT MATRIX */
              <table className="data-table" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, background: "hsl(222 47% 9%)", zIndex: 2, minWidth: 200 }}>
                      Student & Division
                    </th>
                    <th style={{ minWidth: 90 }}>Roll / USN</th>
                    {monthDays.map(day => {
                      const dayWeekend = isWeekend(day);
                      const todayCheck = isToday(day);
                      return (
                        <th
                          key={day.toISOString()}
                          style={{
                            textAlign: "center",
                            padding: "0.4rem 0.25rem",
                            minWidth: 32,
                            background: todayCheck ? "rgba(59,130,246,0.18)" : dayWeekend ? "rgba(255,255,255,0.015)" : undefined,
                            borderLeft: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <div style={{ fontSize: "0.68rem", color: todayCheck ? "#60a5fa" : dayWeekend ? "hsl(215 16% 40%)" : "hsl(215 16% 65%)" }}>
                            {format(day, "EE")[0]}
                          </div>
                          <div style={{ fontSize: "0.82rem", fontWeight: todayCheck ? 800 : 600, color: todayCheck ? "#93c5fd" : undefined }}>
                            {format(day, "d")}
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ textAlign: "center", minWidth: 70, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>P / Total</th>
                    <th style={{ textAlign: "center", minWidth: 75 }}>Rate %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={monthDays.length + 3} style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}>
                        No enrolled students found for {selectedSchool || "this campus"}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(s => {
                      const dateMap = studentAttendanceMap.get(s.id);
                      let presentCount = 0;
                      let markedCount = 0;

                      return (
                        <tr key={s.id}>
                          {/* Sticky Name column */}
                          <td style={{ position: "sticky", left: 0, background: "hsl(222 47% 9%)", zIndex: 1, fontWeight: 600 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div className="avatar" style={{ width: 26, height: 26, background: "rgba(59,130,246,0.15)", color: "#3b82f6", fontSize: "0.7rem" }}>
                                {s.user.name[0]}
                              </div>
                              <div>
                                <div style={{ color: "hsl(213 31% 91%)" }}>{s.user.name}</div>
                                <div style={{ fontSize: "0.68rem", color: "hsl(215 16% 50%)" }}>
                                  {s.class ? `${s.class.name} (${s.class.section})` : "General"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-primary" style={{ fontSize: "0.7rem" }}>{s.rollNumber}</span></td>

                          {/* Date Columns */}
                          {monthDays.map(day => {
                            const dStr = format(day, "yyyy-MM-dd");
                            const rec = dateMap?.get(dStr);
                            if (rec) {
                              markedCount++;
                              if (rec.status === "PRESENT") presentCount++;
                            }
                            const dayWeekend = isWeekend(day);
                            return (
                              <td
                                key={dStr}
                                style={{
                                  textAlign: "center",
                                  padding: "0.3rem 0.15rem",
                                  borderLeft: "1px solid rgba(255,255,255,0.04)",
                                  background: dayWeekend ? "rgba(255,255,255,0.01)" : undefined,
                                }}
                              >
                                {renderCellStatus(rec?.status, dayWeekend)}
                              </td>
                            );
                          })}

                          {/* Present Summary */}
                          <td style={{ textAlign: "center", fontWeight: 700, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                            <span style={{ color: "#34d399" }}>{presentCount}</span> / <span style={{ color: "hsl(215 16% 55%)" }}>{markedCount}</span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {markedCount > 0 ? (
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: (presentCount / markedCount) >= 0.75 ? "#34d399" : "#f87171",
                                }}
                              >
                                {Math.round((presentCount / markedCount) * 100)}%
                              </span>
                            ) : (
                              <span style={{ color: "hsl(215 16% 40%)" }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* TEACHER MATRIX */
              <table className="data-table" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, background: "hsl(222 47% 9%)", zIndex: 2, minWidth: 220 }}>
                      Faculty Member & Dept
                    </th>
                    <th style={{ minWidth: 90 }}>Employee ID</th>
                    {monthDays.map(day => {
                      const dayWeekend = isWeekend(day);
                      const todayCheck = isToday(day);
                      return (
                        <th
                          key={day.toISOString()}
                          style={{
                            textAlign: "center",
                            padding: "0.4rem 0.25rem",
                            minWidth: 32,
                            background: todayCheck ? "rgba(168,85,247,0.18)" : dayWeekend ? "rgba(255,255,255,0.015)" : undefined,
                            borderLeft: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <div style={{ fontSize: "0.68rem", color: todayCheck ? "#c084fc" : dayWeekend ? "hsl(215 16% 40%)" : "hsl(215 16% 65%)" }}>
                            {format(day, "EE")[0]}
                          </div>
                          <div style={{ fontSize: "0.82rem", fontWeight: todayCheck ? 800 : 600, color: todayCheck ? "#e9d5ff" : undefined }}>
                            {format(day, "d")}
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ textAlign: "center", minWidth: 70, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>P / Total</th>
                    <th style={{ textAlign: "center", minWidth: 75 }}>Rate %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={monthDays.length + 3} style={{ textAlign: "center", padding: "3rem", color: "hsl(215 16% 47%)" }}>
                        No faculty members found for {selectedSchool || "this campus"}
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map(t => {
                      const dateMap = teacherAttendanceMap.get(t.id);
                      let presentCount = 0;
                      let markedCount = 0;

                      return (
                        <tr key={t.id}>
                          <td style={{ position: "sticky", left: 0, background: "hsl(222 47% 9%)", zIndex: 1, fontWeight: 600 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div className="avatar" style={{ width: 26, height: 26, background: "rgba(168,85,247,0.15)", color: "#c084fc", fontSize: "0.7rem" }}>
                                {t.user.name[0]}
                              </div>
                              <div>
                                <div style={{ color: "hsl(213 31% 91%)" }}>{t.user.name}</div>
                                <div style={{ fontSize: "0.68rem", color: "hsl(215 16% 50%)" }}>{t.department || "General"}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-accent" style={{ fontSize: "0.7rem" }}>{t.employeeId}</span></td>

                          {/* Date Columns */}
                          {monthDays.map(day => {
                            const dStr = format(day, "yyyy-MM-dd");
                            const rec = dateMap?.get(dStr);
                            if (rec) {
                              markedCount++;
                              if (rec.status === "PRESENT") presentCount++;
                            }
                            const dayWeekend = isWeekend(day);
                            return (
                              <td
                                key={dStr}
                                style={{
                                  textAlign: "center",
                                  padding: "0.3rem 0.15rem",
                                  borderLeft: "1px solid rgba(255,255,255,0.04)",
                                  background: dayWeekend ? "rgba(255,255,255,0.01)" : undefined,
                                }}
                              >
                                {renderCellStatus(rec?.status, dayWeekend)}
                              </td>
                            );
                          })}

                          {/* Present Summary */}
                          <td style={{ textAlign: "center", fontWeight: 700, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                            <span style={{ color: "#34d399" }}>{presentCount}</span> / <span style={{ color: "hsl(215 16% 55%)" }}>{markedCount}</span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {markedCount > 0 ? (
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: (presentCount / markedCount) >= 0.85 ? "#34d399" : "#f87171",
                                }}
                              >
                                {Math.round((presentCount / markedCount) * 100)}%
                              </span>
                            ) : (
                              <span style={{ color: "hsl(215 16% 40%)" }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ─── VIEW 2: SINGLE DATE ROSTER SHEET ─── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === "SINGLE_DAY" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid hsl(216 34% 17%)", borderRadius: "0.75rem", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid hsl(216 34% 17%)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, color: "hsl(213 31% 95%)" }}>
                Roster for: <span style={{ color: "#60a5fa" }}>{format(new Date(selectedSingleDate), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                onClick={() => (activeTab === "STUDENT" ? openStudentMarkModal(selectedSingleDate) : openTeacherMarkModal(selectedSingleDate))}
              >
                <Plus size={14} /> Update Attendance for this Date
              </button>
            </div>

            {loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "hsl(215 16% 47%)" }}>Loading roster...</div>
            ) : activeTab === "STUDENT" ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll / USN</th>
                    <th>Division / Class</th>
                    <th>Status on {format(new Date(selectedSingleDate), "MMM d")}</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => {
                    const rec = studentAttendanceMap.get(s.id)?.get(selectedSingleDate);
                    return (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div className="avatar" style={{ width: 30, height: 30, background: "rgba(59,130,246,0.15)", color: "#3b82f6", fontSize: "0.75rem" }}>
                              {s.user.name[0]}
                            </div>
                            <span style={{ fontWeight: 600 }}>{s.user.name}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-primary">{s.rollNumber}</span></td>
                        <td>{s.class ? `${s.class.name} (${s.class.section})` : "General"}</td>
                        <td>
                          {rec ? (
                            <span className={`badge ${rec.status === "PRESENT" ? "badge-success" : rec.status === "ABSENT" ? "badge-danger" : "badge-warning"}`}>
                              {rec.status}
                            </span>
                          ) : (
                            <span style={{ color: "hsl(215 16% 40%)", fontSize: "0.8rem" }}>Not Marked</span>
                          )}
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 50%)" }}>{rec?.note || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Faculty Member</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Check-in Time</th>
                    <th>Status on {format(new Date(selectedSingleDate), "MMM d")}</th>
                    <th>Leave Reason / Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map(t => {
                    const rec = teacherAttendanceMap.get(t.id)?.get(selectedSingleDate);
                    return (
                      <tr key={t.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <div className="avatar" style={{ width: 30, height: 30, background: "rgba(168,85,247,0.15)", color: "#c084fc", fontSize: "0.75rem" }}>
                              {t.user.name[0]}
                            </div>
                            <span style={{ fontWeight: 600 }}>{t.user.name}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-accent">{t.employeeId}</span></td>
                        <td>{t.department || "General"}</td>
                        <td>{rec?.checkInTime || "—"}</td>
                        <td>
                          {rec ? (
                            <span className={`badge ${rec.status === "PRESENT" ? "badge-success" : rec.status === "ON_LEAVE" ? "badge-accent" : rec.status === "ABSENT" ? "badge-danger" : "badge-warning"}`}>
                              {rec.status}
                            </span>
                          ) : (
                            <span style={{ color: "hsl(215 16% 40%)", fontSize: "0.8rem" }}>Not Marked</span>
                          )}
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "hsl(215 16% 50%)" }}>{rec?.note || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── LEGEND ─── */}
        <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem", alignItems: "center", flexWrap: "wrap", fontSize: "0.75rem", color: "hsl(215 16% 60%)" }}>
          <span style={{ fontWeight: 700 }}>Attendance Key:</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(16,185,129,0.2)", color: "#34d399", border: "1px solid rgba(16,185,129,0.4)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.65rem" }}>P</span>
            <span>Present</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.65rem" }}>A</span>
            <span>Absent</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(59,130,246,0.2)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.4)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.65rem" }}>L</span>
            <span>On Leave</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(245,158,11,0.2)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.4)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.65rem" }}>T</span>
            <span>Late</span>
          </div>
        </div>

        {/* ─── MODAL: MARK STUDENT ATTENDANCE ─── */}
        {showMarkStudentModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMarkStudentModal(false)}>
            <div className="modal-content" style={{ maxWidth: 750, maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(213 31% 91%)" }}>Mark Student Attendance</h3>
                  <p style={{ fontSize: "0.8rem", color: "hsl(215 16% 50%)" }}>
                    Campus: <strong style={{ color: "#93c5fd" }}>{selectedSchool}</strong>
                  </p>
                </div>
                <button onClick={() => setShowMarkStudentModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitStudentAttendance}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label className="form-label">Select Division / Class *</label>
                    <select
                      className="form-input"
                      required
                      value={markStudentClassId}
                      onChange={e => handleClassChangeInModal(e.target.value)}
                    >
                      {studentClasses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.section})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Attendance Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={markStudentDate}
                      onChange={e => setMarkStudentDate(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)", fontWeight: 600 }}>Quick Mark:</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "0.25rem 0.625rem", fontSize: "0.78rem" }}
                    onClick={() => markAllStudents("PRESENT")}
                  >
                    <Check size={13} color="#10b981" /> All Present
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "0.25rem 0.625rem", fontSize: "0.78rem" }}
                    onClick={() => markAllStudents("ABSENT")}
                  >
                    <X size={13} color="#ef4444" /> All Absent
                  </button>
                </div>

                <div style={{ border: "1px solid hsl(216 34% 17%)", borderRadius: "0.5rem", overflow: "hidden", marginBottom: "1.25rem" }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Roll No.</th>
                        <th>Status</th>
                        <th>Note (Optional)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsList
                        .filter(s => !markStudentClassId || s.classId === markStudentClassId)
                        .map(s => {
                          const current = studentAttendanceForm[s.id] || { status: "PRESENT", note: "" };
                          return (
                            <tr key={s.id}>
                              <td style={{ fontWeight: 600 }}>{s.user.name}</td>
                              <td><span className="badge badge-primary">{s.rollNumber}</span></td>
                              <td>
                                <div style={{ display: "flex", gap: "0.35rem" }}>
                                  {["PRESENT", "ABSENT", "LATE"].map(st => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() =>
                                        setStudentAttendanceForm(prev => ({
                                          ...prev,
                                          [s.id]: { ...current, status: st },
                                        }))
                                      }
                                      style={{
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: 4,
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        border: "1px solid",
                                        borderColor: current.status === st ? (st === "PRESENT" ? "#10b981" : st === "ABSENT" ? "#ef4444" : "#f59e0b") : "rgba(255,255,255,0.1)",
                                        background: current.status === st ? (st === "PRESENT" ? "rgba(16,185,129,0.2)" : st === "ABSENT" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)") : "transparent",
                                        color: current.status === st ? (st === "PRESENT" ? "#34d399" : st === "ABSENT" ? "#f87171" : "#fbbf24") : "hsl(215 16% 50%)",
                                      }}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="e.g. Fever"
                                  style={{ height: 28, fontSize: "0.75rem", padding: "0 6px" }}
                                  value={current.note}
                                  onChange={e =>
                                    setStudentAttendanceForm(prev => ({
                                      ...prev,
                                      [s.id]: { ...current, note: e.target.value },
                                    }))
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowMarkStudentModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save Student Attendance"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL: MARK TEACHER ATTENDANCE ─── */}
        {showMarkTeacherModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMarkTeacherModal(false)}>
            <div className="modal-content" style={{ maxWidth: 800, maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(213 31% 91%)" }}>Mark Faculty Attendance</h3>
                  <p style={{ fontSize: "0.8rem", color: "hsl(215 16% 50%)" }}>
                    Campus: <strong style={{ color: "#c084fc" }}>{selectedSchool}</strong>
                  </p>
                </div>
                <button onClick={() => setShowMarkTeacherModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(215 16% 47%)" }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitTeacherAttendance}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ width: 220 }}>
                    <label className="form-label">Attendance Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={markTeacherDate}
                      onChange={e => setMarkTeacherDate(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", marginTop: 20 }}>
                    <span style={{ fontSize: "0.8rem", color: "hsl(215 16% 55%)", fontWeight: 600 }}>Quick Mark:</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                      onClick={() => markAllTeachers("PRESENT")}
                    >
                      <Check size={13} color="#10b981" /> All Present
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem 0.75rem", fontSize: "0.78rem" }}
                      onClick={() => markAllTeachers("ON_LEAVE")}
                    >
                      <CalendarIcon size={13} color="#3b82f6" /> All On Leave
                    </button>
                  </div>
                </div>

                <div style={{ border: "1px solid hsl(216 34% 17%)", borderRadius: "0.5rem", overflow: "hidden", marginBottom: "1.25rem" }}>
                  <table className="data-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Faculty Member</th>
                        <th>Dept</th>
                        <th>Status</th>
                        <th>Check-in Time</th>
                        <th>Remarks / Leave Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachersList.map(t => {
                        const current = teacherAttendanceForm[t.id] || { status: "PRESENT", checkInTime: "08:45 AM", note: "" };
                        return (
                          <tr key={t.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{t.user.name}</div>
                              <span className="badge badge-accent" style={{ fontSize: "0.68rem" }}>{t.employeeId}</span>
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "hsl(213 31% 85%)" }}>{t.department || "General"}</td>
                            <td>
                              <div style={{ display: "flex", gap: "0.25rem" }}>
                                {["PRESENT", "ON_LEAVE", "LATE", "ABSENT"].map(st => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() =>
                                      setTeacherAttendanceForm(prev => ({
                                        ...prev,
                                        [t.id]: {
                                          ...current,
                                          status: st,
                                          checkInTime: st === "PRESENT" ? "08:45 AM" : st === "LATE" ? "09:15 AM" : "",
                                        },
                                      }))
                                    }
                                    style={{
                                      padding: "0.2rem 0.45rem",
                                      borderRadius: 4,
                                      fontSize: "0.7rem",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      border: "1px solid",
                                      borderColor: current.status === st ? (st === "PRESENT" ? "#10b981" : st === "ON_LEAVE" ? "#3b82f6" : st === "LATE" ? "#f59e0b" : "#ef4444") : "rgba(255,255,255,0.1)",
                                      background: current.status === st ? (st === "PRESENT" ? "rgba(16,185,129,0.2)" : st === "ON_LEAVE" ? "rgba(59,130,246,0.2)" : st === "LATE" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)") : "transparent",
                                      color: current.status === st ? (st === "PRESENT" ? "#34d399" : st === "ON_LEAVE" ? "#93c5fd" : st === "LATE" ? "#fbbf24" : "#f87171") : "hsl(215 16% 50%)",
                                    }}
                                  >
                                    {st.replace("_", " ")}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="08:45 AM"
                                style={{ height: 28, fontSize: "0.75rem", width: 85, padding: "0 6px" }}
                                value={current.checkInTime}
                                onChange={e =>
                                  setTeacherAttendanceForm(prev => ({
                                    ...prev,
                                    [t.id]: { ...current, checkInTime: e.target.value },
                                  }))
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Conference"
                                style={{ height: 28, fontSize: "0.75rem", padding: "0 6px" }}
                                value={current.note}
                                onChange={e =>
                                  setTeacherAttendanceForm(prev => ({
                                    ...prev,
                                    [t.id]: { ...current, note: e.target.value },
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowMarkTeacherModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-accent" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)", border: "none" }} disabled={saving}>
                    {saving ? "Saving..." : "Save Faculty Attendance"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
