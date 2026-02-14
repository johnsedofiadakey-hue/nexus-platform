import { DefaultSession } from "next-auth";
import { PlatformRole } from "@nexus/database";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: PlatformRole;
      sessionNonce: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: PlatformRole;
    sessionNonce: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: PlatformRole;
    sessionNonce: string;
  }
}
