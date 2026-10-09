-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "actorType" VARCHAR(30) NOT NULL DEFAULT 'admin',
    "actorName" VARCHAR(100),
    "action" VARCHAR(80) NOT NULL,
    "resource" VARCHAR(80) NOT NULL,
    "resourceId" VARCHAR(120),
    "description" VARCHAR(500) NOT NULL,
    "metadata" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resource_createdAt_idx" ON "audit_logs"("resource", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
