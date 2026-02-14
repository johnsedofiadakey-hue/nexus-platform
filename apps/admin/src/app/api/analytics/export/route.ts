import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail } from "@/lib/platform/api-response";
import { parseQuery } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const exportQuerySchema = z
    .object({
        type: z.enum(["sales", "attendance"]),
        from: z.string().optional(),
        to: z.string().optional(),
    })
    .strip();

const protectedGet = withTenantProtection(
    {
        route: "/api/analytics/export",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
        rateLimit: { keyPrefix: "analytics-export-read", max: 20, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const query = parseQuery(new URL(req.url), exportQuerySchema);

        const fromDate = query.from ? new Date(query.from) : new Date(0);
        const toDate = query.to ? new Date(query.to) : new Date();
        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
            return fail("VALIDATION_ERROR", "Invalid date range", 400);
        }

        let csvContent = "";
        let filename = "";

        if (query.type === "sales") {
            filename = `sales_report_${new Date().toISOString().split("T")[0]}.csv`;
            const sales = await ctx.scopedPrisma.sale.findMany({
                where: { createdAt: { gte: fromDate, lte: toDate } },
                include: {
                    shop: { select: { name: true } },
                    user: { select: { name: true } },
                    items: { include: { product: { select: { name: true } } } },
                },
                orderBy: { createdAt: "desc" },
                take: 1000,
            });

            csvContent = "Sale ID,Date,Shop,Agent,Amount,Items,Payment Method\n";
            sales.forEach((sale) => {
                const date = new Date(sale.createdAt).toISOString();
                const shop = sale.shop.name.replace(/,/g, "");
                const agent = (sale.user?.name || "Unknown").replace(/,/g, "");
                const amount = sale.totalAmount;
                const itemSummary = sale.items.map((item) => `${item.product.name}(${item.quantity})`).join("; ");
                csvContent += `${sale.id},${date},${shop},${agent},${amount},"${itemSummary}",${sale.paymentMethod}\n`;
            });
        }

        if (query.type === "attendance") {
            filename = `attendance_log_${new Date().toISOString().split("T")[0]}.csv`;
            const logs = await ctx.scopedPrisma.attendance.findMany({
                where: { date: { gte: fromDate, lte: toDate } },
                include: {
                    user: { select: { name: true, shop: { select: { name: true } } } },
                },
                orderBy: { checkIn: "desc" },
                take: 1000,
            });

            csvContent = "Log ID,Date,Agent,Shop,Check In,Check Out,Duration (Hrs),Status\n";
            logs.forEach((log) => {
                const date = new Date(log.date).toDateString();
                const agent = (log.user.name || "Unknown").replace(/,/g, "");
                const shop = (log.user.shop?.name || "Mobile").replace(/,/g, "");
                const checkIn = log.checkIn ? new Date(log.checkIn).toLocaleTimeString() : "-";
                const checkOut = log.checkOut ? new Date(log.checkOut).toLocaleTimeString() : "-";

                let duration = "0";
                if (log.checkIn && log.checkOut) {
                    const diff = new Date(log.checkOut).getTime() - new Date(log.checkIn).getTime();
                    duration = (diff / (1000 * 60 * 60)).toFixed(2);
                }

                csvContent += `${log.id},${date},${agent},${shop},${checkIn},${checkOut},${duration},${log.status}\n`;
            });
        }

        return new Response(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    }
);

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/analytics/export", requestId, () => protectedGet(req));
}
