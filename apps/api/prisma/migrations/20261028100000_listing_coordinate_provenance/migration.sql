-- Existing listing coordinates may have come from the schema defaults rather
-- than a real farm location. Keep provenance explicit and use 0,0 as the
-- existing no-coordinate sentinel for new listings that have no trusted point.
ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "hasExplicitCoordinates" BOOLEAN NOT NULL DEFAULT false;
