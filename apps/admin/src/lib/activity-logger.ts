import { prisma } from "./prisma";
import { enqueueJob, registerJobHandler, startQueueWorker } from "@/lib/platform/queue";
import { logger } from "@/lib/platform/logger";

export interface ActivityLogParams {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  shopId?: string;
  shopName?: string;
}

let queueBootstrapped = false;

function bootstrapQueue() {
  if (queueBootstrapped) return;
  queueBootstrapped = true;

  registerJobHandler("activity-log", async (payload) => {
    const data = payload as ActivityLogParams;
    await prisma.activityLog.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        description: data.description,
        metadata: data.metadata || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        shopId: data.shopId,
        shopName: data.shopName,
      },
    });
  });

  registerJobHandler("analytics", async (payload) => {
    const data = payload as {
      targetId: string;
      userId: string;
      action: "CREATED" | "UPDATED" | "DELETED" | "PROGRESS_UPDATE";
      previousValue?: any;
      newValue?: any;
      progress?: number;
      achievedValue?: number;
      achievedQuantity?: number;
      notes?: string;
    };

    await prisma.targetHistory.create({
      data: {
        targetId: data.targetId,
        userId: data.userId,
        action: data.action,
        previousValue: data.previousValue || {},
        newValue: data.newValue || {},
        progress: data.progress || 0,
        achievedValue: data.achievedValue || 0,
        achievedQuantity: data.achievedQuantity || 0,
        notes: data.notes,
      },
    });
  });

  startQueueWorker();
}

/**
 * Master Activity Logger - Logs all system activities
 * This captures every meaningful action from agents, admins, and all users
 */
export async function logActivity(params: ActivityLogParams) {
  try {
    bootstrapQueue();
    enqueueJob("activity-log", params);
  } catch (error) {
    logger.error({ err: error }, "Activity Logger Error");
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * Log target-related activities with history tracking
 */
export async function logTargetActivity(
  targetId: string,
  userId: string,
  action: "CREATED" | "UPDATED" | "DELETED" | "PROGRESS_UPDATE",
  previousValue?: any,
  newValue?: any,
  progress?: number,
  achievedValue?: number,
  achievedQuantity?: number,
  notes?: string
) {
  try {
    bootstrapQueue();
    enqueueJob("analytics", {
      targetId,
      userId,
      action,
      previousValue,
      newValue,
      progress,
      achievedValue,
      achievedQuantity,
      notes,
    });
  } catch (error) {
    logger.error({ err: error }, "Target History Logger Error");
  }
}

/**
 * Helper to get client IP from request headers
 */
export function getClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  return realIp || undefined;
}

/**
 * Helper to get user agent from request headers
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") || undefined;
}
