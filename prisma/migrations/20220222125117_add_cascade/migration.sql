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
ALTER TABLE "StvRoundResult" DROP CONSTRAINT "StvRoundResult_resultId_fkey";

-- DropForeignKey
ALTER TABLE "StvRoundResult" DROP CONSTRAINT "StvRoundResult_stvResultId_fkey";

-- DropForeignKey
ALTER TABLE "StvVote" DROP CONSTRAINT "StvVote_votationId_fkey";

-- DropForeignKey
ALTER TABLE "Votation" DROP CONSTRAINT "Votation_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "VotationResult" DROP CONSTRAINT "VotationResult_votationId_fkey";

-- DropForeignKey
ALTER TABLE "VotationResultReview" DROP CONSTRAINT "VotationResultReview_participantId_fkey";

-- DropForeignKey
ALTER TABLE "VotationResultReview" DROP CONSTRAINT "VotationResultReview_votationId_fkey";

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotationResultReview" ADD CONSTRAINT "VotationResultReview_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotationResultReview" ADD CONSTRAINT "VotationResultReview_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Votation" ADD CONSTRAINT "Votation_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasVoted" ADD CONSTRAINT "HasVoted_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasVoted" ADD CONSTRAINT "HasVoted_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternative" ADD CONSTRAINT "Alternative_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StvVote" ADD CONSTRAINT "StvVote_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativeRoundVoteCount" ADD CONSTRAINT "AlternativeRoundVoteCount_alterantiveId_fkey" FOREIGN KEY ("alterantiveId") REFERENCES "Alternative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativeRoundVoteCount" ADD CONSTRAINT "AlternativeRoundVoteCount_stvRoundResultId_fkey" FOREIGN KEY ("stvRoundResultId") REFERENCES "StvRoundResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StvRoundResult" ADD CONSTRAINT "StvRoundResult_stvResultId_fkey" FOREIGN KEY ("stvResultId") REFERENCES "StvResult"("votationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StvRoundResult" ADD CONSTRAINT "StvRoundResult_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "VotationResult"("votationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StvResult" ADD CONSTRAINT "StvResult_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotationResult" ADD CONSTRAINT "VotationResult_votationId_fkey" FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
