-- Create user-scoped in-app notifications.
-- Notification content is stored as i18n keys so the frontend can render
-- the same event in English, Gujarati, and Hindi.

CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "titleKey" VARCHAR(160) NOT NULL,
    "messageKey" VARCHAR(160) NOT NULL,
    "data" JSONB,
    "relatedPath" VARCHAR(300),
    "relatedType" VARCHAR(60),
    "relatedId" VARCHAR(100),
    "dedupeKey" VARCHAR(200),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notifications_dedupeKey_key"
ON "notifications"("dedupeKey");

CREATE INDEX "notifications_userId_createdAt_idx"
ON "notifications"("userId", "createdAt");

CREATE INDEX "notifications_userId_readAt_createdAt_idx"
ON "notifications"("userId", "readAt", "createdAt");

CREATE INDEX "notifications_type_createdAt_idx"
ON "notifications"("type", "createdAt");

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
