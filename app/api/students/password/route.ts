import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = session.user as { id?: string; role?: string };
  const body = await req.json();
  const { studentId, currentPassword, newPassword, resetToDefault } = body;

  try {
    // ── CASE 1: Admin resetting / changing a student's password ──
    if (studentId) {
      if (currentUser.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden. Only Admins can change other students' passwords." }, { status: 403 });
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true },
      });

      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      const targetPassword = resetToDefault ? "student123" : newPassword;
      if (!targetPassword || targetPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }

      const hashed = await bcrypt.hash(targetPassword, 10);
      await prisma.user.update({
        where: { id: student.userId },
        data: { password: hashed },
      });

      return NextResponse.json({
        success: true,
        message: resetToDefault
          ? `Password reset to default (student123) for ${student.user.name}`
          : `Password updated successfully for ${student.user.name}`,
      });
    }

    // ── CASE 2: User (Student / Teacher / Admin) changing their own password ──
    if (!currentUser.id) {
      return NextResponse.json({ error: "User ID not found in session" }, { status: 400 });
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { password: hashed },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error updating password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
