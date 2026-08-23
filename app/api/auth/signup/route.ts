import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, phone } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const allowedRoles = ["STUDENT", "TEACHER", "ADMIN"];
    const userRole = allowedRoles.includes(role) ? role : "STUDENT";

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        phone: phone || null,
      },
    });

    // If student role, create student profile
    if (userRole === "STUDENT") {
      await prisma.student.create({
        data: {
          userId: user.id,
          rollNumber: `STU${Date.now().toString().slice(-6)}`,
          gender: "OTHER",
          admissionDate: new Date(),
        },
      });
    }

    // If teacher role, create teacher profile
    if (userRole === "TEACHER") {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          employeeId: `EMP${Date.now().toString().slice(-6)}`,
          joiningDate: new Date(),
        },
      });
    }

    return NextResponse.json(
      { message: "Account created successfully.", userId: user.id },
      { status: 201 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
