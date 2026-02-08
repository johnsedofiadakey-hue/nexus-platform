import { prisma } from "./prisma";

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

/**
 * Master Activity Logger - Logs all system activities
 * This captures every meaningful action from agents, admins, and all users
 */
export async function logActivity(params: ActivityLogParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        userRole: params.userRole,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description: params.description,
        metadata: params.metadata || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        shopId: params.shopId,
        shopName: params.shopName,
      },
    });
  } catch (error) {
    console.error("❌ Activity Logger Error:", error);
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
    await prisma.targetHistory.create({
      data: {
        targetId,
        userId,
        action,
        previousValue: previousValue || {},
        newValue: newValue || {},
        progress: progress || 0,
        achievedValue: achievedValue || 0,
        achievedQuantity: achievedQuantity || 0,
        notes,
      },
    });
  } catch (error) {
    console.error("❌ Target History Logger Error:", error);
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
