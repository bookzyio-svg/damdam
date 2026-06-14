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
  pages: { signIn: "/360-pilotage/login" },
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

        // Anti-brute-force : compte verrouillé après trop d'échecs
        const MAX_ATTEMPTS = 5;
        const LOCK_MS = 15 * 60 * 1000; // 15 minutes
        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
          // Verrou actif : refus sans même tester le mot de passe
          return null;
        }

        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) {
          // Échec : on incrémente, et on verrouille si le seuil est atteint
          user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
          if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
            user.lockedUntil = new Date(Date.now() + LOCK_MS);
            user.failedLoginAttempts = 0;
          }
          await user.save().catch(() => {});
          return null;
        }

        // Succès : réinitialisation des compteurs + date de connexion
        user.failedLoginAttempts = 0;
        user.lockedUntil = null as never;
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
