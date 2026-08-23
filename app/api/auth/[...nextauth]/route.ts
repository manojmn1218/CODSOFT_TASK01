import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim() },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          schoolName: user.schoolName,
          profilePic: user.profilePic,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role?: string; phone?: string | null; profilePic?: string | null; schoolName?: string | null };
        token.role = u.role;
        token.id = user.id;
        token.phone = u.phone || null;
        token.schoolName = u.schoolName || null;
        token.profilePic = u.profilePic || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as { role?: string; id?: string; phone?: string | null; profilePic?: string | null; schoolName?: string | null };
        u.role = token.role as string;
        u.id = token.id as string;
        u.phone = (token.phone as string) || null;
        u.schoolName = (token.schoolName as string) || null;
        u.profilePic = (token.profilePic as string) || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
