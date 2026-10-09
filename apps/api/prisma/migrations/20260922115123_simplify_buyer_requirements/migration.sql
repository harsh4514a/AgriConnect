/*
  Warnings:

  - You are about to drop the column `grade` on the `buyer_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `market` on the `buyer_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `maximumExpectedPrice` on the `buyer_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `minimumExpectedPrice` on the `buyer_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `requiredBy` on the `buyer_requirements` table. All the data in the column will be lost.
  - You are about to drop the column `variety` on the `buyer_requirements` table. All the data in the column will be lost.
  - Added the required column `contactNumber` to the `buyer_requirements` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "buyer_requirements_requiredBy_idx";

-- DropIndex
DROP INDEX "buyer_requirements_status_requiredBy_idx";

-- AlterTable
ALTER TABLE "buyer_requirements" DROP COLUMN "grade",
DROP COLUMN "market",
DROP COLUMN "maximumExpectedPrice",
DROP COLUMN "minimumExpectedPrice",
DROP COLUMN "requiredBy",
DROP COLUMN "variety",
ADD COLUMN     "contactNumber" VARCHAR(20) NOT NULL,
ADD COLUMN     "taluka" VARCHAR(100),
ADD COLUMN     "village" VARCHAR(100);
