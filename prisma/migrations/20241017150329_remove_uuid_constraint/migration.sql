/*
  Warnings:

  - The primary key for the `HasVoted` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "HasVoted" DROP CONSTRAINT "HasVoted_userId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_userId_fkey";

-- AlterTable
ALTER TABLE "HasVoted" DROP CONSTRAINT "HasVoted_pkey",
ALTER COLUMN "userId" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "HasVoted_pkey" PRIMARY KEY ("userId", "votationId");

-- AlterTable
ALTER TABLE "Meeting" ALTER COLUMN "ownerId" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Participant" ALTER COLUMN "userId" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HasVoted" ADD CONSTRAINT "HasVoted_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
