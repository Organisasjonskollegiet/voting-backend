-- CreateTable
CREATE TABLE "VotationResultReview" (
    "votationId" UUID NOT NULL,
    "participantId" UUID NOT NULL,
    "approved" BOOLEAN NOT NULL,

    PRIMARY KEY ("votationId","participantId")
);

-- AddForeignKey
ALTER TABLE "VotationResultReview" ADD FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotationResultReview" ADD FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
