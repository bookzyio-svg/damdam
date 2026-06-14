"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/** Wrapper client pour exposer le contexte de session NextAuth au back-office. */
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
