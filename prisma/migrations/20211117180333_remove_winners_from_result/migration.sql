/*
  Warnings:

  - You are about to drop the column `winnerOfVotationId` on the `Alternative` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Alternative" DROP CONSTRAINT "Alternative_winnerOfVotationId_fkey";

-- AlterTable
ALTER TABLE "Alternative" DROP COLUMN "winnerOfVotationId";
