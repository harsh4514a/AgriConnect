-- CreateTable
CREATE TABLE "market_prices" (
    "id" UUID NOT NULL,
    "sourceRecordKey" VARCHAR(64) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "market" VARCHAR(150) NOT NULL,
    "commodity" VARCHAR(150) NOT NULL,
    "variety" VARCHAR(150) NOT NULL DEFAULT '',
    "grade" VARCHAR(100) NOT NULL DEFAULT '',
    "dataDate" DATE NOT NULL,
    "minimumPrice" DOUBLE PRECISION NOT NULL,
    "maximumPrice" DOUBLE PRECISION NOT NULL,
    "modalPrice" DOUBLE PRECISION NOT NULL,
    "source" VARCHAR(50) NOT NULL DEFAULT 'data.gov.in',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "market_prices_sourceRecordKey_key" ON "market_prices"("sourceRecordKey");

-- CreateIndex
CREATE INDEX "market_prices_state_dataDate_idx" ON "market_prices"("state", "dataDate");

-- CreateIndex
CREATE INDEX "market_prices_district_dataDate_idx" ON "market_prices"("district", "dataDate");

-- CreateIndex
CREATE INDEX "market_prices_market_dataDate_idx" ON "market_prices"("market", "dataDate");

-- CreateIndex
CREATE INDEX "market_prices_commodity_dataDate_idx" ON "market_prices"("commodity", "dataDate");

-- CreateIndex
CREATE INDEX "market_prices_variety_dataDate_idx" ON "market_prices"("variety", "dataDate");
