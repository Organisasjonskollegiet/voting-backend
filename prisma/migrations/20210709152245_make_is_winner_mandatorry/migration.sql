/*
  Warnings:

  - Made the column `isWinner` on table `Alternative` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Alternative" ALTER COLUMN "isWinner" SET NOT NULL,
ALTER COLUMN "isWinner" SET DEFAULT false;
