import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action, lat, lng } = await req.json();

        if (!['CLOCK_IN', 'CLOCK_OUT'].includes(action)) {
            return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
        }

        // 1. Get Agent & Shop
        const agent = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { shop: true }
        });

        if (!agent || !agent.shop) {
            return NextResponse.json({ error: "Agent or Shop not found" }, { status: 404 });
        }

        // 2. Validate Geofence (Server-Side Enforcement)
        const R = 6371e3; // Earth Radius
        const dLat = (agent.shop.latitude! - lat) * Math.PI / 180;
        const dLng = (agent.shop.longitude! - lng) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(agent.shop.latitude! * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        const allowedRadius = agent.shop.radius || 100;

        let attendanceStatus = 'PRESENT';

        if (distance > allowedRadius) {
            attendanceStatus = 'OFF_SITE';
            // We allow this now, but mark it as OFF_SITE
        }

        // 3. Process Attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let record;

        if (action === 'CLOCK_IN') {
            // Check if already clocked in today
            const existing = await prisma.attendance.findFirst({
                where: {
                    userId: agent.id,
                    date: { gte: today }
                }
            });

            if (existing) {
                return NextResponse.json({ error: "Already clocked in today." }, { status: 409 });
            }

            record = await prisma.attendance.create({
                data: {
                    userId: agent.id,
                    checkIn: new Date(),
                    status: attendanceStatus,
                    date: new Date()
                }
            });
        } else {
            // CLOCK_OUT
            const active = await prisma.attendance.findFirst({
                where: {
                    userId: agent.id,
                    checkOut: null
                },
                orderBy: { checkIn: 'desc' }
            });

            if (!active) {
                return NextResponse.json({ error: "No active shift found." }, { status: 404 });
            }

            record = await prisma.attendance.update({
                where: { id: active.id },
                data: {
                    checkOut: new Date()
                }
            });
        }

        return NextResponse.json({ success: true, record });

    } catch (error) {
        console.error("ATTENDANCE ACTION ERROR:", error);
        return NextResponse.json({ error: "System Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    // Check Status
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ status: 'UNKNOWN' });

        const agent = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!agent) return NextResponse.json({ status: 'UNKNOWN' });

        const active = await prisma.attendance.findFirst({
            where: {
                userId: agent.id,
                checkOut: null,
                date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }
        });

        return NextResponse.json({ status: active ? 'CLOCKED_IN' : 'CLOCKED_OUT' });

    } catch (e) {
        return NextResponse.json({ status: 'UNKNOWN' });
    }
}
