-- CreateTable
CREATE TABLE "gujarat_market_regions" (
    "id" UUID NOT NULL,
    "region" VARCHAR(50) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gujarat_market_regions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gujarat_market_regions_district_key" ON "gujarat_market_regions"("district");

-- CreateIndex
CREATE INDEX "gujarat_market_regions_region_idx" ON "gujarat_market_regions"("region");
