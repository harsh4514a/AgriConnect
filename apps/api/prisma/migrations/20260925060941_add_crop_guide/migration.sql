-- AlterTable
ALTER TABLE "crop_guides" ADD COLUMN     "seasonKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];
