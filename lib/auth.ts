import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { AdminUser } from "@/lib/models/AdminUser";

/**
 * NextAuth — authentification du back-office uniquement (credentials + bcrypt).
 * Stratégie JWT (pas de table de sessions). Le rôle est porté dans le token.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await AdminUser.findOne({
          email: credentials.email.toLowerCase(),
          active: true,
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;

        // Met à jour la date de dernière connexion (best effort)
        user.lastLoginAt = new Date();
        await user.save().catch(() => {});

        return {
          id: user._id.toString(),
          email: user.email ?? "",
          name: user.name ?? "",
          role: user.role ?? "staff",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "staff";
        token.id = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
