import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // For now, if no orgId, return defaults or fetch the first created org (Single Tenant Mode)
        // If Multi-tenant, we'd use session.user.organizationId
        let org = null;
        if (session.user.organizationId) {
            org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });
        } else {
            // Fallback for current single-setup users: Get the first Organization or Create one
            org = await prisma.organization.findFirst();
            if (!org) {
                org = await prisma.organization.create({
                    data: {
                        name: "My Organization",
                        slug: "my-org-" + Date.now(),
                        primaryColor: "#2563EB",
                        secondaryColor: "#0F172A",
                        accentColor: "#F59E0B"
                    }
                });
                // Auto-link user?
                // await prisma.user.update({ where: { id: session.user.id }, data: { organizationId: org.id }});
            }
        }

        return NextResponse.json(org);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Check Admin Role
        const userRole = session.user.role; // Assuming role is in session, or fetch user
        // Ideally fetch user to confirm role if session is stale, but for speed logic:
        if (userRole === "WORKER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const { primaryColor, secondaryColor, accentColor, logoUrl, name, planType } = body;

        // Resolve Org ID (Same logic as GET)
        let orgId = session.user.organizationId;
        if (!orgId) {
            const org = await prisma.organization.findFirst();
            if (org) orgId = org.id;
        }

        if (!orgId) return NextResponse.json({ error: "No Organization Found" }, { status: 404 });

        const updated = await prisma.organization.update({
            where: { id: orgId },
            data: {
                // Only update fields if provided
                ...(primaryColor && { primaryColor }),
                ...(secondaryColor && { secondaryColor }),
                ...(accentColor && { accentColor }),
                ...(logoUrl !== undefined && { logoUrl }), // Allow clearing if empty string passed?
                ...(name && { name }),
                // Billing Plan logic could go here or separate route
            }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error("Settings Update Error:", error);
        return NextResponse.json({ error: "Update Failed" }, { status: 500 });
    }
}
