import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

    return withApiErrorHandling(req, "/api/hr/member/[id]/export", requestId, async () => {
        const { id } = await props.params;

        const protectedGet = withTenantProtection(
            {
                route: "/api/hr/member/[id]/export",
                roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
                rateLimit: { keyPrefix: "hr-member-export", max: 20, windowMs: 60_000 },
            },
            async (_request, ctx) => {
                const whereClause: any = { id };
                if (ctx.sessionUser.role !== "SUPER_ADMIN" && ctx.orgId) {
                    whereClause.organizationId = ctx.orgId;
                }

                const user = await ctx.scopedPrisma.user.findFirst({
                    where: whereClause,
                    include: {
                        sales: { orderBy: { createdAt: "desc" }, take: 1000 },
                        attendance: { orderBy: { date: "desc" }, take: 1000 },
                        dailyReports: { orderBy: { createdAt: "desc" }, take: 1000 },
                        shop: true,
                    },
                });

                if (!user) {
                    return fail("NOT_FOUND", "User not found", 404);
                }

                const rows: Array<Array<string | number>> = [];
                rows.push(["NEXUS INTELLIGENCE REPORT", `AGENT: ${user.name}`, `GENERATED: ${new Date().toISOString()}`]);
                rows.push([]);

                rows.push(["--- PERFORMANCE SUMMARY ---"]);
                rows.push(["Metric", "Value"]);
                rows.push(["Total Sales Count", user.sales.length]);
                rows.push(["Total Revenue", user.sales.reduce((acc, sale) => acc + sale.totalAmount, 0)]);
                rows.push(["Attendance Records", user.attendance.length]);
                rows.push(["Reports Filed", user.dailyReports.length]);
                rows.push([]);

                rows.push(["--- RECENT SALES ---"]);
                rows.push(["Date", "Sale ID", "Amount", "Items"]);
                user.sales.forEach((sale) => {
                    rows.push([new Date(sale.createdAt).toLocaleDateString(), sale.id.slice(-6), sale.totalAmount, "N/A"]);
                });
                rows.push([]);

                rows.push(["--- ATTENDANCE LOG ---"]);
                rows.push(["Date", "Status", "Check In", "Check Out", "Duration (Hrs)", "Location"]);
                user.attendance.forEach((attendance) => {
                    const duration = attendance.checkOut
                        ? ((new Date(attendance.checkOut).getTime() - new Date(attendance.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(2)
                        : "-";

                    rows.push([
                        new Date(attendance.date).toLocaleDateString(),
                        attendance.status,
                        new Date(attendance.checkIn).toLocaleTimeString(),
                        attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : "-",
                        duration,
                        "N/A",
                    ]);
                });

                const csvContent = rows.map((entry) => entry.join(",")).join("\n");
                return new Response(csvContent, {
                    status: 200,
                    headers: {
                        "Content-Type": "text/csv",
                        "Content-Disposition": `attachment; filename=\"nexus_report_${user.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv\"`,
                    },
                });
            }
        );

        return protectedGet(req);
    });
}
