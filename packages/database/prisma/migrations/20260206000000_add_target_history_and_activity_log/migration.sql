-- Create TargetHistory table to track target changes and progress
CREATE TABLE "TargetHistory" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "progress" DOUBLE PRECISION DEFAULT 0,
    "achievedValue" DOUBLE PRECISION DEFAULT 0,
    "achievedQuantity" INTEGER DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TargetHistory_pkey" PRIMARY KEY ("id")
);

-- Create indexes for TargetHistory
CREATE INDEX "TargetHistory_targetId_idx" ON "TargetHistory"("targetId");
CREATE INDEX "TargetHistory_userId_idx" ON "TargetHistory"("userId");
CREATE INDEX "TargetHistory_createdAt_idx" ON "TargetHistory"("createdAt");

-- Create ActivityLog table for master activity logging
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "shopId" TEXT,
    "shopName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes for ActivityLog
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX "ActivityLog_entity_idx" ON "ActivityLog"("entity");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX "ActivityLog_shopId_idx" ON "ActivityLog"("shopId");
