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

  const subjects = await prisma.subject.findMany({
    where: whereClause,
    include: {
      class: { select: { name: true, section: true, schoolName: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(subjects);
}
