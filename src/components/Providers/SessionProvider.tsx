"use client";

import { SessionProvider as NextAuthProvider } from "next-auth/react";

// This MUST be a named export to match the { SessionProvider } import
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthProvider>{children}</NextAuthProvider>;
}