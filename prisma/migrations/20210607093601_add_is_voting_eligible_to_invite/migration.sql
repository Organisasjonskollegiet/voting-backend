-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PARTICIPANT', 'COUNTER');

-- CreateEnum
CREATE TYPE "MajorityType" AS ENUM ('QUALIFIED', 'SIMPLE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('UPCOMING', 'ONGOING', 'ENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" UUID NOT NULL,
    "organization" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "ownerId" UUID NOT NULL,
    "status" "Status" NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "userId" UUID,
    "meetingId" UUID NOT NULL,
    "isVotingEligible" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isVotingEligible" BOOLEAN NOT NULL,
    "meetingId" UUID NOT NULL
);

-- CreateTable
CREATE TABLE "Votation" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT E'UPCOMING',
    "blankVotes" BOOLEAN NOT NULL,
    "hiddenVotes" BOOLEAN NOT NULL,
    "severalVotes" BOOLEAN NOT NULL,
    "majorityType" "MajorityType" NOT NULL,
    "majorityThreshold" INTEGER NOT NULL,
    "meetingId" UUID NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HasVoted" (
    "votationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId","votationId")
);

-- CreateTable
CREATE TABLE "Alternative" (
    "id" UUID NOT NULL,
    "text" VARCHAR(120) NOT NULL,
    "votationId" UUID NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" UUID NOT NULL,
    "alternativeId" UUID NOT NULL,
    "nextVoteId" UUID,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Participant.userId_meetingId_unique" ON "Participant"("userId", "meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite.email_meetingId_unique" ON "Invite"("email", "meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_nextVoteId_unique" ON "Vote"("nextVoteId");

-- AddForeignKey
ALTER TABLE "Meeting" ADD FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Votation" ADD FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasVoted" ADD FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasVoted" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternative" ADD FOREIGN KEY ("votationId") REFERENCES "Votation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD FOREIGN KEY ("alternativeId") REFERENCES "Alternative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD FOREIGN KEY ("nextVoteId") REFERENCES "Vote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
