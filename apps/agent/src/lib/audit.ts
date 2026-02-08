import { prisma } from "./prisma";

export async function logAction(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    details?: string,
    ipAddress?: string
) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details: details || "",
                ipAddress: ipAddress || "0.0.0.0"
            }
        });
    } catch (error) {
        console.error("❌ AUDIT_LOG_ERROR:", error);
    }
}
