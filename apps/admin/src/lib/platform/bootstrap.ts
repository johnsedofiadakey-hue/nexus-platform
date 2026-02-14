import { prisma } from "@/lib/prisma";
import { registerJobHandler, startQueueWorker } from "./queue";

let started = false;

export function bootstrapPlatformQueue() {
  if (started) return;
  started = true;

  registerJobHandler("notification", async (payload) => {
    const data = payload as {
      organizationId: string;
      type: string;
      title: string;
      message: string;
      link?: string;
    };

    await prisma.notification.create({ data });
  });

  registerJobHandler("billing", async (payload) => {
    const data = payload as { organizationId: string; status: string; nextBillingDate?: string };
    await prisma.organization.update({
      where: { id: data.organizationId },
      data: {
        status: data.status,
        ...(data.nextBillingDate ? { nextBillingDate: new Date(data.nextBillingDate) } : {}),
      },
    });
  });

  startQueueWorker();
}
