-- CreateEnum
CREATE TYPE "League" AS ENUM ('SRDL', 'CRDL');

-- AlterTable
ALTER TABLE "Fixture" ADD COLUMN     "league" "League",
ADD COLUMN     "seasonId" TEXT,
ADD COLUMN     "seasonYear" INTEGER;

-- AlterTable
ALTER TABLE "Standing" ADD COLUMN     "league" "League",
ADD COLUMN     "seasonId" TEXT,
ADD COLUMN     "seasonYear" INTEGER;
