import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as { email?: string; role?: string };
  const role = user.role;
  const email = user.email;

  if (email === "manojmn1218@gmail.com" || role === "ADMIN") {
    redirect("/admin");
  }
  if (role === "PRINCIPAL") {
    redirect("/admin/students");
  }
  if (role === "TEACHER") {
    redirect("/teacher");
  }
  if (role === "STUDENT") {
    redirect("/student");
  }

  redirect("/login");
}
