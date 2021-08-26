/*
  Warnings:

  - You are about to drop the column `severalVotes` on the `Votation` table. All the data in the column will be lost.
  - You are about to drop the column `majorityType` on the `Votation` table. All the data in the column will be lost.
  - Added the required column `type` to the `Votation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VotationType" AS ENUM ('QUALIFIED', 'SIMPLE', 'STV');

-- AlterTable
ALTER TABLE "Votation" DROP COLUMN "severalVotes",
DROP COLUMN "majorityType",
ADD COLUMN     "type" "VotationType" NOT NULL;

-- DropEnum
DROP TYPE "MajorityType";
