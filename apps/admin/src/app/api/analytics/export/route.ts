import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'sales' | 'attendance'
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (!type || !['sales', 'attendance'].includes(type)) {
            return NextResponse.json({ error: "Invalid Export Type" }, { status: 400 });
        }

        const orgId = session.user.organizationId;
        const dateFilter = {
            createdAt: {
                gte: from ? new Date(from) : new Date(0), // Default to beginning of time
                lte: to ? new Date(to) : new Date()
            }
        };

        let csvContent = "";
        let filename = "";

        if (type === 'sales') {
            filename = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
            // Fetch Sales
            const sales = await prisma.sale.findMany({
                where: {
                    shop: { organizationId: orgId }, // Link via Shop to ensure Org ownership
                    ...dateFilter
                },
                include: {
                    shop: { select: { name: true } },
                    user: { select: { name: true } },
                    items: {
                        include: { product: { select: { name: true } } }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 1000
            });

            // Headers
            csvContent = "Sale ID,Date,Shop,Agent,Amount,Items,Payment Method\n";

            // Rows
            sales.forEach(sale => {
                const date = new Date(sale.createdAt).toISOString();
                const shop = sale.shop.name.replace(/,/g, '');
                const agent = sale.user?.name?.replace(/,/g, '') || 'Unknown';
                const amount = sale.totalAmount;
                const itemSummary = sale.items.map(i => `${i.product.name}(${i.quantity})`).join('; ');

                csvContent += `${sale.id},${date},${shop},${agent},${amount},"${itemSummary}",${sale.paymentMethod}\n`;
            });
        }

        if (type === 'attendance') {
            filename = `attendance_log_${new Date().toISOString().split('T')[0]}.csv`;
            // Fetch Attendance (assuming Attendance model exists linked to User)
            // We need to query User -> Attendance to filter by Org
            const logs = await prisma.attendance.findMany({
                where: {
                    user: { organizationId: orgId },
                    date: {
                        gte: from ? new Date(from) : new Date(0),
                        lte: to ? new Date(to) : new Date()
                    }
                },
                include: {
                    user: { select: { name: true, shop: { select: { name: true } } } }
                },
                orderBy: { checkIn: 'desc' },
                take: 1000
            });

            csvContent = "Log ID,Date,Agent,Shop,Check In,Check Out,Duration (Hrs),Status\n";

            logs.forEach(log => {
                const date = new Date(log.date).toDateString();
                const agent = log.user.name.replace(/,/g, '');
                const shop = log.user.shop?.name.replace(/,/g, '') || 'Mobile';
                const checkIn = log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : '-';
                const checkOut = log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : '-';

                let duration = "0";
                if (log.checkIn && log.checkOut) {
                    const diff = new Date(log.checkOut).getTime() - new Date(log.checkIn).getTime();
                    duration = (diff / (1000 * 60 * 60)).toFixed(2);
                }

                csvContent += `${log.id},${date},${agent},${shop},${checkIn},${checkOut},${duration},${log.status}\n`;
            });
        }

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error("EXPORT_ERROR:", error);
        return NextResponse.json({ error: "Export Failed" }, { status: 500 });
    }
}
