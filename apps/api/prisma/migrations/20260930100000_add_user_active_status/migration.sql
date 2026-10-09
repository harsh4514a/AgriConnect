ALTER TABLE "users"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "users_isActive_createdAt_idx" ON "users"("isActive", "createdAt");
