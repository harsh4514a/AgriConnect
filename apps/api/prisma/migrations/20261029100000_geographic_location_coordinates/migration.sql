-- Persist sourced coordinates and administrative identifiers on the existing
-- canonical location hierarchy. Existing location rows and relationships are
-- retained; all new fields are nullable so unknown coordinates stay unknown.
ALTER TABLE "districts"
  ADD COLUMN "lgdCode" INTEGER,
  ADD COLUMN "census2011Code" VARCHAR(20),
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "coordinateSource" VARCHAR(120),
  ADD COLUMN "coordinateSourceId" VARCHAR(180),
  ADD COLUMN "coordinateReferenceType" VARCHAR(40),
  ADD COLUMN "coordinatesImportedAt" TIMESTAMP(3);

ALTER TABLE "talukas"
  ADD COLUMN "lgdCode" INTEGER,
  ADD COLUMN "census2011Code" VARCHAR(20),
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "coordinateSource" VARCHAR(120),
  ADD COLUMN "coordinateSourceId" VARCHAR(180),
  ADD COLUMN "coordinateReferenceType" VARCHAR(40),
  ADD COLUMN "coordinatesImportedAt" TIMESTAMP(3);

ALTER TABLE "villages"
  ADD COLUMN "lgdCode" INTEGER,
  ADD COLUMN "census2011Code" VARCHAR(20),
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "coordinateSource" VARCHAR(120),
  ADD COLUMN "coordinateSourceId" VARCHAR(180),
  ADD COLUMN "coordinateReferenceType" VARCHAR(40),
  ADD COLUMN "coordinatesImportedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "districts_lgdCode_key" ON "districts"("lgdCode");
CREATE UNIQUE INDEX "talukas_lgdCode_key" ON "talukas"("lgdCode");
CREATE UNIQUE INDEX "villages_lgdCode_key" ON "villages"("lgdCode");

ALTER TABLE "districts"
  ADD CONSTRAINT "districts_coordinates_pair_check"
    CHECK (("latitude" IS NULL) = ("longitude" IS NULL)),
  ADD CONSTRAINT "districts_latitude_range_check"
    CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "districts_longitude_range_check"
    CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);

ALTER TABLE "talukas"
  ADD CONSTRAINT "talukas_coordinates_pair_check"
    CHECK (("latitude" IS NULL) = ("longitude" IS NULL)),
  ADD CONSTRAINT "talukas_latitude_range_check"
    CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "talukas_longitude_range_check"
    CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);

ALTER TABLE "villages"
  ADD CONSTRAINT "villages_coordinates_pair_check"
    CHECK (("latitude" IS NULL) = ("longitude" IS NULL)),
  ADD CONSTRAINT "villages_latitude_range_check"
    CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "villages_longitude_range_check"
    CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180);

ALTER TABLE "listings" ADD COLUMN "locationVillageId" UUID;

-- Link a listing only when its complete state/district/taluka/village path
-- identifies exactly one existing canonical village. Leave other listings
-- unlinked for the inventory report; do not infer by village name alone.
WITH candidates AS (
  SELECT listing."id" AS listing_id, village."id" AS village_id,
         COUNT(*) OVER (PARTITION BY listing."id") AS candidate_count
  FROM "listings" AS listing
  JOIN "states" AS state
    ON LOWER(BTRIM(state."name")) = LOWER(BTRIM(listing."state"))
  JOIN "districts" AS district
    ON district."stateId" = state."id"
   AND LOWER(BTRIM(district."name")) = LOWER(BTRIM(listing."district"))
  JOIN "talukas" AS taluka
    ON taluka."districtId" = district."id"
   AND LOWER(BTRIM(taluka."name")) = LOWER(BTRIM(listing."taluka"))
  JOIN "villages" AS village
    ON village."talukaId" = taluka."id"
   AND LOWER(BTRIM(village."name")) = LOWER(BTRIM(listing."village"))
)
UPDATE "listings" AS listing
SET "locationVillageId" = candidates.village_id
FROM candidates
WHERE listing."id" = candidates.listing_id
  AND candidates.candidate_count = 1;

ALTER TABLE "listings"
  ADD CONSTRAINT "listings_locationVillageId_fkey"
    FOREIGN KEY ("locationVillageId") REFERENCES "villages"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "listings_locationVillageId_idx" ON "listings"("locationVillageId");
