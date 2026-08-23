import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [totalStudents, totalTeachers, totalClasses, totalExams, pendingFees, paidFees] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.exam.count(),
    prisma.fee.aggregate({ where: { status: { in: ["PENDING", "OVERDUE"] } }, _sum: { amount: true } }),
    prisma.fee.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
  ]);

  // Attendance this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const attendanceStats = await prisma.attendance.groupBy({
    by: ["status"],
    where: { date: { gte: startOfMonth } },
    _count: { status: true },
  });

  const present = attendanceStats.find(a => a.status === "PRESENT")?._count.status || 0;
  const total = attendanceStats.reduce((acc, a) => acc + a._count.status, 0);
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  // Monthly fee collection (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const feesByMonth = await prisma.fee.findMany({
    where: { paidDate: { gte: sixMonthsAgo }, status: "PAID" },
    select: { paidDate: true, amount: true },
  });

  const monthlyFees: Record<string, number> = {};
  feesByMonth.forEach(f => {
    const key = new Date(f.paidDate!).toLocaleString("default", { month: "short" });
    monthlyFees[key] = (monthlyFees[key] || 0) + f.amount;
  });

  return NextResponse.json({
    totalStudents,
    totalTeachers,
    totalClasses,
    totalExams,
    pendingFees: pendingFees._sum.amount || 0,
    paidFees: paidFees._sum.amount || 0,
    attendanceRate,
    monthlyFees,
  });
}
