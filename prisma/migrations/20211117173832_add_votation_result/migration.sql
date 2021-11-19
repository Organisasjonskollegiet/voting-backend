-- AlterTable
ALTER TABLE "Alternative" ADD COLUMN     "winnerOfVotationId" UUID;

-- AlterTable
ALTER TABLE "StvRoundResult" ADD COLUMN     "resultId" UUID;

-- CreateTable
CREATE TABLE "VotationResult" (
    "votationId" UUID NOT NULL,
    "votingEligibleCount" INTEGER NOT NULL,
    "voteCount" INTEGER NOT NULL,
    "quota" DOUBLE PRECISION,

    PRIMARY KEY ("votationId")
);

-- AddForeignKey
ALTER TABLE "VotationResult" ADD FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternative" ADD FOREIGN KEY ("winnerOfVotationId") REFERENCES "VotationResult"("votationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StvRoundResult" ADD FOREIGN KEY ("resultId") REFERENCES "VotationResult"("votationId") ON DELETE SET NULL ON UPDATE CASCADE;
