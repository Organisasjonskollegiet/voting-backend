/*
  Warnings:

  - You are about to drop the column `nextVoteId` on the `Vote` table. All the data in the column will be lost.
  - Added the required column `stvVoteId` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_nextVoteId_fkey";

-- DropIndex
DROP INDEX "Vote_nextVoteId_unique";

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "nextVoteId",
ADD COLUMN     "ranking" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "stvVoteId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "StvVote" (
    "id" UUID NOT NULL,
    "votationId" UUID NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StvVote" ADD FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD FOREIGN KEY ("stvVoteId") REFERENCES "StvVote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
