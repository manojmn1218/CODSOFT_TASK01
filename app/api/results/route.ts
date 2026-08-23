import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const results = await prisma.examResult.findMany({
    where: studentId ? { studentId } : undefined,
    include: {
      exam: {
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true, section: true } },
        },
      },
      student: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(results);
}
