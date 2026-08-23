import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = session.user as { email?: string; role?: string; id?: string };
  const user = await prisma.user.findUnique({
    where: { email: currentUser.email || "" },
    select: { schoolName: true, role: true },
  });

  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");
  const role = user?.role || currentUser.role;

  const whereClause: any = {};
  if (target) {
    whereClause.target = target;
  } else if (role !== "ADMIN") {
    whereClause.target = { in: ["ALL", role || "ALL"] };
  }

  if (currentUser.email !== "manojmn1218@gmail.com" && user?.schoolName) {
    whereClause.OR = [
      { schoolName: user.schoolName },
      { schoolName: null },
    ];
  }

  const announcements = await prisma.announcement.findMany({
    where: whereClause,
    include: { createdBy: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(announcements);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as { email?: string; role?: string; id?: string };
  const userRole = currentUser?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "PRINCIPAL")) {
    return NextResponse.json({ error: "Forbidden. Only Admins and Principals can post announcements." }, { status: 403 });
  }

  const creatorUser = await prisma.user.findUnique({
    where: { email: currentUser?.email || "" },
    select: { schoolName: true },
  });

  const body = await req.json();
  const { title, content, target, schoolName } = body;
  const userId = currentUser.id;

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        target: target || "ALL",
        schoolName: schoolName || creatorUser?.schoolName || null,
        createdById: userId!,
      },
    });
    return NextResponse.json(announcement, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error creating announcement";
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

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
