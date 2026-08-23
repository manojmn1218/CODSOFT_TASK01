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
  const schoolParam = searchParams.get("schoolName");

  const whereClause: any = {};
  if (currentUser.email !== "manojmn1218@gmail.com" && user?.schoolName) {
    whereClause.schoolName = user.schoolName;
  } else if (schoolParam) {
    whereClause.schoolName = schoolParam;
  }

  const classes = await prisma.class.findMany({
    where: whereClause,
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      _count: { select: { students: true, subjects: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(classes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as { email?: string; role?: string };
  const userRole = currentUser?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL")) {
    return NextResponse.json({ error: "Forbidden. Only Admins and Principals can create classes." }, { status: 403 });
  }

  const creatorUser = await prisma.user.findUnique({
    where: { email: currentUser?.email || "" },
    select: { schoolName: true },
  });

  const body = await req.json();
  const { name, section, teacherId, academicYear, schoolName } = body;

  const assignedSchool = schoolName || creatorUser?.schoolName || "Main Institution";

  try {
    const cls = await prisma.class.create({
      data: {
        name,
        section,
        schoolName: assignedSchool,
        academicYear: academicYear || "2024-25",
        teacherId: teacherId || null,
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { students: true, subjects: true } },
      },
    });
    return NextResponse.json(cls, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error creating class";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
