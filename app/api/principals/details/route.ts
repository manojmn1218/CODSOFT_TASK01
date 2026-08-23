import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Principal ID is required." }, { status: 400 });
  }

  try {
    const principal = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        schoolName: true,
        profilePic: true,
        createdAt: true,
      },
    });

    if (!principal) {
      return NextResponse.json({ error: "Principal not found" }, { status: 404 });
    }

    const schoolFilter = principal.schoolName ? { schoolName: principal.schoolName } : {};

    // Fetch segregated school data
    const [students, teachers, classes] = await Promise.all([
      prisma.student.findMany({
        where: schoolFilter,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          class: { select: { name: true, section: true } },
          fees: { select: { amount: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.teacher.findMany({
        where: schoolFilter,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          classes: { select: { name: true, section: true } },
          subjects: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.class.findMany({
        where: schoolFilter,
        include: {
          teacher: { include: { user: { select: { name: true } } } },
          students: { select: { id: true } },
          subjects: { select: { id: true } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const studentIds = students.map(s => s.id);
    const classIds = classes.map(c => c.id);

    const [fees, exams, attendance] = await Promise.all([
      prisma.fee.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          student: { include: { user: { select: { name: true } } } },
        },
        orderBy: { dueDate: "desc" },
      }),
      prisma.exam.findMany({
        where: { classId: { in: classIds } },
        include: {
          class: { select: { name: true, section: true } },
          subject: { select: { name: true } },
          results: { select: { marksObtained: true } },
        },
        orderBy: { date: "desc" },
      }),
      prisma.attendance.findMany({
        where: { studentId: { in: studentIds } },
        select: { status: true },
      }),
    ]);

    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
    const paidFees = fees.filter(f => f.status === "PAID").reduce((sum, f) => sum + f.amount, 0);
    const pendingFees = fees.filter(f => f.status === "PENDING").reduce((sum, f) => sum + f.amount, 0);
    const overdueFees = fees.filter(f => f.status === "OVERDUE").reduce((sum, f) => sum + f.amount, 0);

    const totalAtt = attendance.length;
    const presentAtt = attendance.filter(a => a.status === "PRESENT").length;
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 95;

    return NextResponse.json({
      principal,
      stats: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        totalExams: exams.length,
        attendanceRate,
        feeSummary: {
          total: totalFees,
          paid: paidFees,
          pending: pendingFees,
          overdue: overdueFees,
        },
      },
      students,
      teachers,
      classes,
      fees,
      exams,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error fetching principal details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
