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
  const schoolParam = searchParams.get("schoolName");

  const whereClause: any = {};
  if (studentId) whereClause.studentId = studentId;

  if (currentUser.email !== "manojmn1218@gmail.com" && user?.schoolName) {
    whereClause.student = { schoolName: user.schoolName };
  } else if (schoolParam) {
    whereClause.student = { schoolName: schoolParam };
  }

  const fees = await prisma.fee.findMany({
    where: whereClause,
    include: {
      student: { include: { user: { select: { name: true, schoolName: true } } } },
    },
    orderBy: { dueDate: "desc" },
  });

  return NextResponse.json(fees);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  try {
    const fee = await prisma.fee.create({
      data: { ...body, dueDate: new Date(body.dueDate), paidDate: body.paidDate ? new Date(body.paidDate) : null },
    });
    return NextResponse.json(fee, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, status } = body;
  try {
    const fee = await prisma.fee.update({
      where: { id },
      data: { status, paidDate: status === "PAID" ? new Date() : null },
    });
    return NextResponse.json(fee);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
