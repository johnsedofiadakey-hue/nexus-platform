import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";

export const dynamic = "force-dynamic";

const planSchema = z.object({
  name: z.string().min(1),
  pricePerShopMonthly: z.number().nonnegative(),
  annualDiscountPercent: z.number().min(0).max(100),
  features: z.array(z.string()),
});

export async function GET() {
  try {
    await requirePlatformAdmin();
    const plans = await prisma.plan.findMany({ orderBy: { createdAt: "asc" } });
    return Response.json({ success: true, data: plans });
  } catch {
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requirePlatformAdmin();
    const payload = planSchema.parse(await req.json());
    const plan = await prisma.plan.create({ data: payload });
    return Response.json({ success: true, data: plan }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, error: { code: "VALIDATION", message: error.message } }, { status: 400 });
    }
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}
