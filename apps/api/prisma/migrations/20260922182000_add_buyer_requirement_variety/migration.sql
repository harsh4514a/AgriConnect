-- Add optional crop variety back to buyer requirements.
ALTER TABLE "buyer_requirements"
ADD COLUMN "variety" VARCHAR(100);
