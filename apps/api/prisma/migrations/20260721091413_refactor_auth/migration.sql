/*
  Warnings:

  - You are about to drop the column `attempts` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `otps` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - Added the required column `mobileNumber` to the `otps` table without a default value. This is not possible if the table is not empty.
  - Made the column `mobileNumber` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "otps" DROP CONSTRAINT "otps_userId_fkey";

-- DropIndex
DROP INDEX "otps_userId_createdAt_idx";

-- DropIndex
DROP INDEX "users_email_idx";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "otps" DROP COLUMN "attempts",
DROP COLUMN "userId",
ADD COLUMN     "mobileNumber" VARCHAR(15) NOT NULL,
ADD COLUMN     "resendAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationAttempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email",
DROP COLUMN "passwordHash",
ALTER COLUMN "mobileNumber" SET NOT NULL,
ALTER COLUMN "preferredLanguage" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "otps_mobileNumber_idx" ON "otps"("mobileNumber");

-- CreateIndex
CREATE INDEX "otps_expiresAt_idx" ON "otps"("expiresAt");
