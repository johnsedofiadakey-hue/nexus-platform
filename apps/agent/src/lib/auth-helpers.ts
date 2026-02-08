import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * 🔐 AUTHENTICATION & AUTHORIZATION HELPERS
 * Reusable utilities for API route protection and tenant isolation
 */

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    organizationId: string | null;
}

/**
 * Get authenticated user from session
 * @returns User object or null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return null;
    }

    return {
        id: (session.user as any).id || "",
        email: session.user.email,
        name: session.user.name || null,
        role: (session.user as any).role || "WORKER",
        organizationId: (session.user as any).organizationId || null,
    };
}

/**
 * Require authentication - throws 401 if not authenticated
 * @returns Authenticated user object
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
    const user = await getAuthenticatedUser();

    if (!user) {
        throw new Error("UNAUTHORIZED");
    }

    return user;
}

/**
 * Require specific role(s) - throws 403 if user doesn't have required role
 * @param allowedRoles - Array of allowed roles
 * @returns Authenticated user object
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthenticatedUser> {
    const user = await requireAuth();

    if (!allowedRoles.includes(user.role)) {
        throw new Error("FORBIDDEN");
    }

    return user;
}

/**
 * Get organization ID from authenticated user
 * @param allowSuperAdmin - If true, allows SUPER_ADMIN without organizationId
 * @returns Organization ID
 */
export async function getOrganizationId(allowSuperAdmin = false): Promise<string> {
    const user = await requireAuth();

    // Super admins can bypass organization requirement
    if (allowSuperAdmin && user.role === "SUPER_ADMIN") {
        return ""; // Empty string signals "all organizations"
    }

    if (!user.organizationId) {
        throw new Error("NO_ORGANIZATION");
    }

    return user.organizationId;
}

/**
 * Handle API errors consistently
 * @param error - Error object
 * @returns NextResponse with appropriate status code
 */
export function handleApiError(error: any): NextResponse {
    console.error("API Error:", error);

    if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
            { error: "Unauthorized - Please sign in" },
            { status: 401 }
        );
    }

    if (error.message === "FORBIDDEN") {
        return NextResponse.json(
            { error: "Forbidden - Insufficient permissions" },
            { status: 403 }
        );
    }

    if (error.message === "NO_ORGANIZATION") {
        return NextResponse.json(
            { error: "No organization assigned" },
            { status: 400 }
        );
    }

    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
}
