import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const params = await props.params;
        const { id } = params;

        // 1. Fetch Comprehensive Data
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                sales: { orderBy: { createdAt: 'desc' }, take: 1000 },
                attendance: { orderBy: { date: 'desc' }, take: 1000 },
                dailyReports: { orderBy: { createdAt: 'desc' }, take: 1000 },
                shop: true
            }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 2. Generate CSV Content
        const rows = [];

        // HEADER
        rows.push(['NEXUS INTELLIGENCE REPORT', `AGENT: ${user.name}`, `GENERATED: ${new Date().toISOString()}`]);
        rows.push([]);

        // SUMMARY SECTION
        rows.push(['--- PERFORMANCE SUMMARY ---']);
        rows.push(['Metric', 'Value']);
        rows.push(['Total Sales Count', user.sales.length]);
        rows.push(['Total Revenue', user.sales.reduce((acc, s) => acc + s.totalAmount, 0)]);
        rows.push(['Attendance Records', user.attendance.length]);
        rows.push(['Reports Filed', user.dailyReports.length]);
        rows.push([]);

        // SALES LOG
        rows.push(['--- RECENT SALES ---']);
        rows.push(['Date', 'Sale ID', 'Amount', 'Items']);
        user.sales.forEach(s => {
            rows.push([
                new Date(s.createdAt).toLocaleDateString(),
                s.id.slice(-6),
                s.totalAmount,
                // @ts-ignore
                s.items ? JSON.parse(JSON.stringify(s.items)).length : 'N/A'
            ]);
        });
        rows.push([]);

        // ATTENDANCE LOG
        rows.push(['--- ATTENDANCE LOG ---']);
        rows.push(['Date', 'Status', 'Check In', 'Check Out', 'Duration (Hrs)', 'Location']);
        user.attendance.forEach(a => {
            const duration = a.checkOut ? ((new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(2) : '-';
            rows.push([
                new Date(a.date).toLocaleDateString(),
                a.status,
                new Date(a.checkIn).toLocaleTimeString(),
                a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '-',
                duration,
                'N/A' // Location not strictly tracked in Attendance model yet
            ]);
        });

        // 3. Format as CSV String
        const csvContent = rows.map(e => e.join(",")).join("\n");

        // 4. Return as Download
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="nexus_report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

    } catch (error) {
        console.error("Export Error:", error);
        return NextResponse.json({ error: "Export Failed" }, { status: 500 });
    }
}
