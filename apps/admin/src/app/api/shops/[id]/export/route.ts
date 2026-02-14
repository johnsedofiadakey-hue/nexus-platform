import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();

    // Role gate: only managers and above can export data
    if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role || '')) {
      return NextResponse.json({ error: "Forbidden: Insufficient permissions." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const type = searchParams.get('type') || 'reports'; // 'reports' or 'sales'
    const format = searchParams.get('format') || 'csv'; // 'csv' (Excel-compatible)
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!shopId) {
      return NextResponse.json({ error: "shopId required" }, { status: 400 });
    }

    // Verify shop access
    const shop = await prisma.shop.findFirst({
      where: {
        id: shopId,
        ...(user.role !== 'SUPER_ADMIN' ? { organizationId: user.organizationId } : {})
      }
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to + 'T23:59:59.999Z');

    if (type === 'reports') {
      const reports = await prisma.dailyReport.findMany({
        where: {
          shopId,
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        },
        include: {
          user: { select: { name: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      });

      if (format === 'csv') {
        const header = 'Date,Time,Promoter,Role,Walk-Ins,Inquiries,Buyers,Conversion %,Market Intel,Stock Gaps,Notes\n';
        const rows = reports.map(r => {
          const date = new Date(r.createdAt).toLocaleDateString();
          const time = new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const conversion = r.walkIns > 0 ? Math.round((r.buyers / r.walkIns) * 100) : 0;
          const intel = r.marketIntel ? r.marketIntel.replace(/"/g, '""') : '';
          const gaps = r.stockGaps ? r.stockGaps.replace(/"/g, '""') : '';
          const notes = r.notes ? r.notes.replace(/"/g, '""') : '';
          return `${date},${time},"${r.user?.name || 'Unknown'}",${r.user?.role || ''},${r.walkIns},${r.inquiries},${r.buyers},${conversion}%,"${intel}","${gaps}","${notes}"`;
        }).join('\n');

        return new Response(header + rows, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${shop.name}_field_reports_${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      }

      return NextResponse.json({ success: true, data: reports, shop: shop.name });
    }

    if (type === 'sales') {
      const sales = await prisma.sale.findMany({
        where: {
          shopId,
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        },
        include: {
          user: { select: { name: true } },
          items: { include: { product: { select: { name: true, barcode: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        take: 500
      });

      if (format === 'csv') {
        const header = 'Date,Time,Sale ID,Sold By,Payment Method,Status,Total Amount,Amount Paid,Items\n';
        const rows = sales.map(s => {
          const date = new Date(s.createdAt).toLocaleDateString();
          const time = new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const items = s.items.map(i => `${i.product?.name || 'Unknown'} x${i.quantity}`).join('; ');
          return `${date},${time},${s.id},"${s.user?.name || 'Unknown'}",${s.paymentMethod},${s.status},${s.totalAmount.toFixed(2)},${s.amountPaid.toFixed(2)},"${items}"`;
        }).join('\n');

        return new Response(header + rows, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${shop.name}_sales_report_${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      }

      return NextResponse.json({ success: true, data: sales, shop: shop.name });
    }

    return NextResponse.json({ error: "Invalid type. Use 'reports' or 'sales'" }, { status: 400 });
  } catch (error) {
    console.error("EXPORT ERROR:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
