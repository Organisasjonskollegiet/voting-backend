-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_alternativeId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_stvVoteId_fkey";

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "Alternative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_stvVoteId_fkey" FOREIGN KEY ("stvVoteId") REFERENCES "StvVote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
