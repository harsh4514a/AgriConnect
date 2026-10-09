-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL,
    "cropKey" VARCHAR(30) NOT NULL,
    "image" VARCHAR(300) NOT NULL,
    "imageAlt" VARCHAR(200) NOT NULL,
    "farmerName" VARCHAR(100) NOT NULL,
    "farmerNameShort" VARCHAR(60) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "village" VARCHAR(100) NOT NULL,
    "taluka" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL DEFAULT 'Gujarat',
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "primaryUnit" VARCHAR(40) NOT NULL,
    "secondaryUnit" VARCHAR(40) NOT NULL,
    "marketPrice" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "postedHoursAgo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availability" VARCHAR(20) NOT NULL DEFAULT 'available',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "mobileNumber" VARCHAR(15) NOT NULL,
    "phoneLabel" VARCHAR(60) NOT NULL,
    "readyToSell" BOOLEAN NOT NULL DEFAULT true,
    "lat" DOUBLE PRECISION NOT NULL DEFAULT 22.03,
    "lng" DOUBLE PRECISION NOT NULL DEFAULT 71.2,
    "description" TEXT,
    "variety" VARCHAR(100),
    "customCropName" VARCHAR(100),
    "qualityGrade" VARCHAR(50),
    "cropDate" VARCHAR(20),
    "farmerMemberSince" INTEGER,
    "farmerListingCount" INTEGER,
    "additionalImages" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "isUserCreated" BOOLEAN NOT NULL DEFAULT false,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listings_cropKey_idx" ON "listings"("cropKey");

-- CreateIndex
CREATE INDEX "listings_district_idx" ON "listings"("district");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_userId_idx" ON "listings"("userId");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
