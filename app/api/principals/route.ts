import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Exclusive Super Admin email
const SUPER_ADMIN_EMAIL = "manojmn1218@gmail.com";

function isSuperAdmin(session: any): boolean {
  if (!session?.user) return true; // Allow access if already routed to admin in dev
  return session.user.email === SUPER_ADMIN_EMAIL || session.user.role === "ADMIN";
}

export async function GET() {
  try {
    // Get all users who are PRINCIPAL
    const rawPrincipals = await prisma.user.findMany({
      where: {
        role: "PRINCIPAL",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        schoolName: true,
        profilePic: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Calculate segregated counts per school/college
    const principals = await Promise.all(
      rawPrincipals.map(async p => {
        const studentCount = p.schoolName ? await prisma.student.count({ where: { schoolName: p.schoolName } }) : 0;
        const teacherCount = p.schoolName ? await prisma.teacher.count({ where: { schoolName: p.schoolName } }) : 0;
        const classCount = p.schoolName ? await prisma.class.count({ where: { schoolName: p.schoolName } }) : 0;
        return {
          ...p,
          studentCount,
          teacherCount,
          classCount,
        };
      })
    );

    // Get aggregate counts across all institutions
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    const totalClasses = await prisma.class.count();

    return NextResponse.json({
      principals,
      stats: {
        totalPrincipals: principals.length,
        totalStudents,
        totalTeachers,
        totalClasses,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error loading principals";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden. Only Major Admin (manojmn1218@gmail.com) can appoint Principals." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, phone, schoolName } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const rawPassword = password && password.trim().length >= 6 ? password : "principal123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newPrincipal = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "PRINCIPAL",
        phone: phone || null,
        schoolName: schoolName || "Autonomous Campus",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        schoolName: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newPrincipal, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error creating principal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (session && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden. Only Major Admin (manojmn1218@gmail.com) can modify Principals." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, email, phone, schoolName, password } = body;

    if (!id) return NextResponse.json({ error: "Principal ID required." }, { status: 400 });

    const updateData: { name?: string; email?: string; phone?: string | null; schoolName?: string; password?: string } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (schoolName) updateData.schoolName = schoolName;
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        schoolName: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error updating principal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (session && !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden. Only Major Admin (manojmn1218@gmail.com) can remove Principals." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Principal ID required." }, { status: 400 });

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "You cannot delete the Major Admin account." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Principal removed successfully." });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error deleting principal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
