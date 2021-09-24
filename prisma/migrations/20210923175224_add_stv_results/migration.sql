-- AlterTable
ALTER TABLE "Alternative" ADD COLUMN     "winnerOfStvRoundId" UUID,
ADD COLUMN     "loserOfStvRoundId" UUID;

-- CreateTable
CREATE TABLE "AlternativeRoundVoteCount" (
    "alterantiveId" UUID NOT NULL,
    "voteCount" INTEGER NOT NULL,
    "stvRoundResultId" UUID NOT NULL,

    PRIMARY KEY ("alterantiveId","stvRoundResultId")
);

-- CreateTable
CREATE TABLE "StvRoundResult" (
    "id" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "stvResultId" UUID NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StvResult" (
    "votationId" UUID NOT NULL,
    "quota" INTEGER NOT NULL,

    PRIMARY KEY ("votationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StvRoundResult.index_stvResultId_unique" ON "StvRoundResult"("index", "stvResultId");

-- AddForeignKey
ALTER TABLE "AlternativeRoundVoteCount" ADD FOREIGN KEY ("alterantiveId") REFERENCES "Alternative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlternativeRoundVoteCount" ADD FOREIGN KEY ("stvRoundResultId") REFERENCES "StvRoundResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StvRoundResult" ADD FOREIGN KEY ("stvResultId") REFERENCES "StvResult"("votationId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StvResult" ADD FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternative" ADD FOREIGN KEY ("winnerOfStvRoundId") REFERENCES "StvRoundResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternative" ADD FOREIGN KEY ("loserOfStvRoundId") REFERENCES "StvRoundResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
