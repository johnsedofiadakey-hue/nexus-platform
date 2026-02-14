import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role?: string;
            organizationId?: string;
            shopId?: string;
            orgAuthVersion?: number;
        } & DefaultSession["user"]
    }

    interface User {
        id: string;
        role?: string;
        organizationId?: string;
        orgAuthVersion?: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        orgAuthVersion?: number;
    }
}
