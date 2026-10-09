-- Transport redesign: ownership, provider type, and additional details.
-- Authentication/roles are intentionally unchanged.

ALTER TABLE "transport_providers"
  ADD COLUMN "ownerId" UUID,
  ADD COLUMN "providerType" VARCHAR(20) NOT NULL DEFAULT 'farmer',
  ADD COLUMN "additionalDetails" VARCHAR(500);

UPDATE "transport_providers"
SET "additionalDetails" = "serviceArea"
WHERE "serviceArea" IS NOT NULL;

ALTER TABLE "transport_providers"
  DROP COLUMN "serviceArea";

CREATE INDEX "transport_providers_ownerId_isActive_createdAt_idx"
  ON "transport_providers"("ownerId", "isActive", "createdAt");

CREATE INDEX "transport_providers_providerType_isActive_isAvailable_idx"
  ON "transport_providers"("providerType", "isActive", "isAvailable");

ALTER TABLE "transport_providers"
  ADD CONSTRAINT "transport_providers_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
