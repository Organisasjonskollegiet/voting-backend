-- DropForeignKey
ALTER TABLE "Alternative" DROP CONSTRAINT "Alternative_votationId_fkey";

-- DropForeignKey
ALTER TABLE "AlternativeRoundVoteCount" DROP CONSTRAINT "AlternativeRoundVoteCount_alterantiveId_fkey";

-- DropForeignKey
ALTER TABLE "AlternativeRoundVoteCount" DROP CONSTRAINT "AlternativeRoundVoteCount_stvRoundResultId_fkey";

-- DropForeignKey
ALTER TABLE "HasVoted" DROP CONSTRAINT "HasVoted_userId_fkey";

-- DropForeignKey
ALTER TABLE "HasVoted" DROP CONSTRAINT "HasVoted_votationId_fkey";

-- DropForeignKey
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_userId_fkey";

-- DropForeignKey
ALTER TABLE "StvResult" DROP CONSTRAINT "StvResult_votationId_fkey";

-- DropForeignKey
ALTER TABLE "StvRoundResult" DROP CONSTRAINT "StvRoundResult_stvResultId_fkey";

-- DropForeignKey
ALTER TABLE "StvVote" DROP CONSTRAINT "StvVote_votationId_fkey";

-- DropForeignKey
ALTER TABLE "Votation" DROP CONSTRAINT "Votation_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "VotationResultReview" DROP CONSTRAINT "VotationResultReview_participantId_fkey";

-- DropForeignKey
ALTER TABLE "VotationResultReview" DROP CONSTRAINT "VotationResultReview_votationId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_alternativeId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_stvVoteId_fkey";

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotationResultReview" ADD CONSTRAINT "VotationResultReview_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotationResultReview" ADD CONSTRAINT "VotationResultReview_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Votation" ADD CONSTRAINT "Votation_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasVoted" ADD CONSTRAINT "HasVoted_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasVoted" ADD CONSTRAINT "HasVoted_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternative" ADD CONSTRAINT "Alternative_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StvVote" ADD CONSTRAINT "StvVote_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativeRoundVoteCount" ADD CONSTRAINT "AlternativeRoundVoteCount_alterantiveId_fkey" FOREIGN KEY ("alterantiveId") REFERENCES "Alternative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativeRoundVoteCount" ADD CONSTRAINT "AlternativeRoundVoteCount_stvRoundResultId_fkey" FOREIGN KEY ("stvRoundResultId") REFERENCES "StvRoundResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StvRoundResult" ADD CONSTRAINT "StvRoundResult_stvResultId_fkey" FOREIGN KEY ("stvResultId") REFERENCES "StvResult"("votationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StvResult" ADD CONSTRAINT "StvResult_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_alternativeId_fkey" FOREIGN KEY ("alternativeId") REFERENCES "Alternative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_stvVoteId_fkey" FOREIGN KEY ("stvVoteId") REFERENCES "StvVote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Invite.email_meetingId_unique" RENAME TO "Invite_email_meetingId_key";

-- RenameIndex
ALTER INDEX "Participant.userId_meetingId_unique" RENAME TO "Participant_userId_meetingId_key";

-- RenameIndex
ALTER INDEX "StvRoundResult.index_stvResultId_unique" RENAME TO "StvRoundResult_index_stvResultId_key";

-- RenameIndex
ALTER INDEX "User.email_unique" RENAME TO "User_email_key";
