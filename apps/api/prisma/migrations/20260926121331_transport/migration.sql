-- CreateTable
CREATE TABLE "transport_providers" (
    "id" UUID NOT NULL,
    "businessName" VARCHAR(120) NOT NULL,
    "contactName" VARCHAR(100),
    "phoneNumber" VARCHAR(15) NOT NULL,
    "vehicleType" VARCHAR(40) NOT NULL,
    "capacityTons" DOUBLE PRECISION NOT NULL,
    "serviceArea" VARCHAR(200),
    "districtId" UUID NOT NULL,
    "talukaId" UUID,
    "villageId" UUID,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transport_providers_districtId_isActive_isAvailable_idx" ON "transport_providers"("districtId", "isActive", "isAvailable");

-- CreateIndex
CREATE INDEX "transport_providers_talukaId_isActive_isAvailable_idx" ON "transport_providers"("talukaId", "isActive", "isAvailable");

-- CreateIndex
CREATE INDEX "transport_providers_villageId_isActive_isAvailable_idx" ON "transport_providers"("villageId", "isActive", "isAvailable");

-- CreateIndex
CREATE INDEX "transport_providers_vehicleType_isActive_isAvailable_idx" ON "transport_providers"("vehicleType", "isActive", "isAvailable");

-- CreateIndex
CREATE INDEX "transport_providers_capacityTons_isActive_isAvailable_idx" ON "transport_providers"("capacityTons", "isActive", "isAvailable");

-- CreateIndex
CREATE INDEX "transport_providers_businessName_idx" ON "transport_providers"("businessName");

-- CreateIndex
CREATE UNIQUE INDEX "transport_providers_businessName_phoneNumber_vehicleType_di_key" ON "transport_providers"("businessName", "phoneNumber", "vehicleType", "districtId", "talukaId", "villageId");

-- AddForeignKey
ALTER TABLE "transport_providers" ADD CONSTRAINT "transport_providers_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_providers" ADD CONSTRAINT "transport_providers_talukaId_fkey" FOREIGN KEY ("talukaId") REFERENCES "talukas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_providers" ADD CONSTRAINT "transport_providers_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "villages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
