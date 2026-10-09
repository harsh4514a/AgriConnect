CREATE TABLE "buyer_requirements" (
    "id" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "cropKey" VARCHAR(30) NOT NULL,
    "customCropName" VARCHAR(100),
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "market" VARCHAR(150),
    "requiredBy" DATE NOT NULL,
    "minimumExpectedPrice" DOUBLE PRECISION,
    "maximumExpectedPrice" DOUBLE PRECISION,
    "variety" VARCHAR(100),
    "grade" VARCHAR(50),
    "additionalRequirements" VARCHAR(1000),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "submissionKey" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_requirements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "buyer_requirements_submissionKey_key"
ON "buyer_requirements"("submissionKey");

CREATE INDEX "buyer_requirements_buyerId_idx" ON "buyer_requirements"("buyerId");
CREATE INDEX "buyer_requirements_status_idx" ON "buyer_requirements"("status");
CREATE INDEX "buyer_requirements_cropKey_idx" ON "buyer_requirements"("cropKey");
CREATE INDEX "buyer_requirements_district_idx" ON "buyer_requirements"("district");
CREATE INDEX "buyer_requirements_requiredBy_idx" ON "buyer_requirements"("requiredBy");
CREATE INDEX "buyer_requirements_createdAt_idx" ON "buyer_requirements"("createdAt");
CREATE INDEX "buyer_requirements_status_requiredBy_idx" ON "buyer_requirements"("status", "requiredBy");

ALTER TABLE "buyer_requirements"
ADD CONSTRAINT "buyer_requirements_buyerId_fkey"
FOREIGN KEY ("buyerId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
