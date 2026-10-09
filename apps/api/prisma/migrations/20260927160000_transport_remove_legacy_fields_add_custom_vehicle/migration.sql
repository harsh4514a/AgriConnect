-- Align TransportProvider with the final transport marketplace model.
-- Authentication roles remain unchanged (normal user + admin).

ALTER TABLE "transport_providers"
  ADD COLUMN "customVehicleType" VARCHAR(100);

DROP INDEX IF EXISTS "transport_providers_capacityTons_isActive_isAvailable_idx";
DROP INDEX IF EXISTS "transport_providers_providerType_isActive_isAvailable_idx";

ALTER TABLE "transport_providers"
  DROP COLUMN "capacityTons",
  DROP COLUMN "providerType";
