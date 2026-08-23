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
    whereClause.class = { schoolName: user.schoolName };
  } else if (schoolParam) {
    whereClause.class = { schoolName: schoolParam };
  }

  const exams = await prisma.exam.findMany({
    where: whereClause,
    include: {
      class: { select: { name: true, section: true, schoolName: true } },
      subject: { select: { name: true } },
      _count: { select: { results: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL" && userRole !== "TEACHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  try {
    const exam = await prisma.exam.create({
      data: {
        ...body,
        date: new Date(body.date),
      },
    });
    return NextResponse.json(exam, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
