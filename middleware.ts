import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string | undefined;
  const email = token.email as string | undefined;

  // Major Admin Hub (pathname === "/admin" or "/admin/principals") is exclusively for Major Admin (manojmn1218@gmail.com)
  if ((pathname === "/admin" || pathname === "/admin/principals") && email !== "manojmn1218@gmail.com" && role !== "ADMIN") {
    const target = role === "PRINCIPAL" ? "/admin/students" : role === "TEACHER" ? "/teacher" : role === "STUDENT" ? "/student" : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }

  // School administration routes are for ADMIN and PRINCIPAL
  if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "PRINCIPAL") {
    const target = role === "TEACHER" ? "/teacher" : role === "STUDENT" ? "/student" : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }
  if (pathname.startsWith("/teacher") && role !== "TEACHER") {
    const target = role === "ADMIN" ? "/admin" : role === "PRINCIPAL" ? "/admin/students" : role === "STUDENT" ? "/student" : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }
  if (pathname.startsWith("/student") && role !== "STUDENT") {
    const target = role === "ADMIN" ? "/admin" : role === "PRINCIPAL" ? "/admin/students" : role === "TEACHER" ? "/teacher" : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
