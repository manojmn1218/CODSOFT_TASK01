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

  const students = await prisma.student.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true, schoolName: true } },
      class: { select: { id: true, name: true, section: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as { email?: string; role?: string };
  const userRole = currentUser?.role;

  // Admin, Principal, and Teacher can add students
  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL" && userRole !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden. Only Admins, Principals, and Teachers can add students." }, { status: 403 });
  }

  const creatorUser = await prisma.user.findUnique({
    where: { email: currentUser?.email || "" },
    select: { schoolName: true },
  });

  const body = await req.json();
  const { name, email, rollNumber, classId, gender, dob, parentName, parentPhone, address, password, schoolName } = body;

  if (!name || !email || !rollNumber) {
    return NextResponse.json({ error: "Name, email, and roll number are required." }, { status: 400 });
  }

  const assignedSchool = schoolName || creatorUser?.schoolName || "Main Institution";

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingRoll) {
      return NextResponse.json({ error: "A student with this roll number already exists." }, { status: 409 });
    }

    // Default password for all students is student123
    const rawPassword = password && password.trim().length >= 6 ? password : "student123";
    const hashedPw = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPw,
        role: "STUDENT",
        schoolName: assignedSchool,
        phone: parentPhone || null,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        rollNumber,
        schoolName: assignedSchool,
        classId: classId || null,
        gender: gender || "MALE",
        dob: dob ? String(dob) : null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        address: address || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, schoolName: true } },
        class: { select: { id: true, name: true, section: true } },
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error creating student";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL" && userRole !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, name, classId, gender, dob, parentName, parentPhone, address, schoolName } = body;

  try {
    const existingStudent = await prisma.student.findUnique({ where: { id } });
    if (!existingStudent) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const userUpdate: any = {};
    if (name) userUpdate.name = name;
    if (schoolName) userUpdate.schoolName = schoolName;

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: existingStudent.userId },
        data: userUpdate,
      });
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        classId: classId !== undefined ? (classId || null) : undefined,
        gender,
        dob: dob !== undefined ? (dob ? String(dob) : null) : undefined,
        parentName,
        parentPhone,
        address,
        schoolName: schoolName || undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, schoolName: true } },
        class: { select: { id: true, name: true, section: true } },
      },
    });

    return NextResponse.json(student);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error updating student";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL")) {
    return NextResponse.json({ error: "Forbidden. Only Admins and Principals can delete students." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.student.delete({ where: { id } });
  await prisma.user.delete({ where: { id: student.userId } });

  return NextResponse.json({ success: true });
}
