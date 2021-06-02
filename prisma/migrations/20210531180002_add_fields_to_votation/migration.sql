/*
  Warnings:

  - Added the required column `hiddenVotes` to the `Votation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `severalVotes` to the `Votation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Votation" ADD COLUMN     "hiddenVotes" BOOLEAN NOT NULL,
ADD COLUMN     "severalVotes" BOOLEAN NOT NULL;
