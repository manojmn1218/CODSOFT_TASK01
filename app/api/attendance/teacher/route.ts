import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = session.user as { email?: string; role?: string };
  const user = await prisma.user.findUnique({
    where: { email: currentUser.email || "" },
    select: { schoolName: true, role: true },
  });

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");
  const schoolParam = searchParams.get("schoolName");
  const dateParam = searchParams.get("date");

  const where: any = {};
  if (teacherId) where.teacherId = teacherId;

  if (currentUser.email !== "manojmn1218@gmail.com" && user?.schoolName) {
    where.schoolName = user.schoolName;
  } else if (schoolParam) {
    where.schoolName = schoolParam;
  }

  if (dateParam) {
    const d = new Date(dateParam);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(d.getDate() + 1);
    where.date = {
      gte: d,
      lt: nextD,
    };
  }

  const records = await prisma.teacherAttendance.findMany({
    where,
    include: {
      teacher: {
        include: {
          user: { select: { name: true, email: true, phone: true, schoolName: true } },
        },
      },
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as { email?: string; role?: string };
  const userRole = currentUser?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL")) {
    return NextResponse.json({ error: "Forbidden. Only Admins and Principals can mark teacher attendance." }, { status: 403 });
  }

  const creatorUser = await prisma.user.findUnique({
    where: { email: currentUser?.email || "" },
    select: { schoolName: true },
  });

  const body = await req.json();
  const { records } = body; // array of { teacherId, date, status, checkInTime, note }

  if (!records || !Array.isArray(records)) {
    return NextResponse.json({ error: "Invalid payload. Array of records required." }, { status: 400 });
  }

  try {
    const results = [];
    for (const r of records) {
      const date = new Date(r.date);
      date.setHours(0, 0, 0, 0);

      const teacher = await prisma.teacher.findUnique({ where: { id: r.teacherId } });
      const assignedSchool = teacher?.schoolName || creatorUser?.schoolName || "Main Institution";

      // Check if record exists for this teacher and date
      const existing = await prisma.teacherAttendance.findFirst({
        where: {
          teacherId: r.teacherId,
          date: {
            gte: date,
            lt: new Date(date.getTime() + 86400000),
          },
        },
      });

      if (existing) {
        const updated = await prisma.teacherAttendance.update({
          where: { id: existing.id },
          data: {
            status: r.status || "PRESENT",
            checkInTime: r.checkInTime || undefined,
            note: r.note || undefined,
          },
        });
        results.push(updated);
      } else {
        const created = await prisma.teacherAttendance.create({
          data: {
            teacherId: r.teacherId,
            schoolName: assignedSchool,
            date,
            status: r.status || "PRESENT",
            checkInTime: r.checkInTime || (r.status === "PRESENT" ? "08:45 AM" : null),
            note: r.note || null,
          },
        });
        results.push(created);
      }
    }
    return NextResponse.json(results, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error saving teacher attendance";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
