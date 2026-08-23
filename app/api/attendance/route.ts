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
  const studentId = searchParams.get("studentId");
  const classId = searchParams.get("classId");
  const schoolParam = searchParams.get("schoolName");

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (classId) where.classId = classId;

  if (currentUser.email !== "manojmn1218@gmail.com" && user?.schoolName) {
    where.student = { schoolName: user.schoolName };
  } else if (schoolParam) {
    where.student = { schoolName: schoolParam };
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      student: { include: { user: { select: { name: true, schoolName: true } } } },
      class: { select: { name: true, section: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json(attendance);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { records } = body; // array of { studentId, classId, date, status }

  try {
    const results = [];
    for (const r of records) {
      const date = new Date(r.date);
      const record = await prisma.attendance.upsert({
        where: {
          id: (await prisma.attendance.findFirst({
            where: { studentId: r.studentId, classId: r.classId, date },
          }))?.id || "new",
        },
        create: { studentId: r.studentId, classId: r.classId, date, status: r.status },
        update: { status: r.status },
      }).catch(async () => {
        return await prisma.attendance.create({
          data: { studentId: r.studentId, classId: r.classId, date, status: r.status },
        });
      });
      results.push(record);
    }
    return NextResponse.json(results, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
