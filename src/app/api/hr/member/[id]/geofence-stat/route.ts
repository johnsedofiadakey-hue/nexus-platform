import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const logs = await prisma.complianceLog.findMany({
    where: {
      userId: params.id,
      type: 'GEOFENCE_BREACH',
      createdAt: { gte: sevenDaysAgo }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Group by day for the chart
  const stats = logs.reduce((acc: any, log) => {
    const day = new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json(Object.entries(stats).map(([name, breaches]) => ({ name, breaches })));
}