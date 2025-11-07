-- AlterEnum
ALTER TYPE "FixtureType" ADD VALUE 'SRDL_LEAGUE';

-- AlterTable
ALTER TABLE "Standing" ADD COLUMN     "group" TEXT;
