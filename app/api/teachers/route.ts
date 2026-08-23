import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const teachers = await prisma.teacher.findMany({
    where: whereClause,
    include: {
      user: { select: { name: true, email: true, phone: true, schoolName: true } },
      classes: { select: { name: true, section: true } },
      subjects: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(teachers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as { email?: string; role?: string };
  const userRole = currentUser?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL")) {
    return NextResponse.json({ error: "Forbidden. Only Admins and Principals can add teachers." }, { status: 403 });
  }

  const creatorUser = await prisma.user.findUnique({
    where: { email: currentUser?.email || "" },
    select: { schoolName: true },
  });

  const body = await req.json();
  const { name, email, employeeId, qualification, department, phone, schoolName } = body;

  const assignedSchool = schoolName || creatorUser?.schoolName || "Main Institution";

  try {
    const hashedPw = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPw,
        role: "TEACHER",
        phone: phone || null,
        schoolName: assignedSchool,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId,
        qualification,
        department,
        schoolName: assignedSchool,
      },
      include: {
        user: { select: { name: true, email: true, phone: true, schoolName: true } },
        classes: { select: { name: true, section: true } },
        subjects: { select: { name: true } },
      },
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error creating teacher";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.teacher.delete({ where: { id } });
  await prisma.user.delete({ where: { id: teacher.userId } });

  return NextResponse.json({ success: true });
}
