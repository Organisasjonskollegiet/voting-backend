/*
  Warnings:

  - The `status` column on the `Votation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `status` on the `Meeting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('UPCOMING', 'ONGOING', 'ENDED');

-- CreateEnum
CREATE TYPE "VotationStatus" AS ENUM ('UPCOMING', 'OPEN', 'CHECKING_RESULT', 'PUBLISHED_RESULT');

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "status",
ADD COLUMN     "status" "MeetingStatus" NOT NULL;

-- AlterTable
ALTER TABLE "Votation" DROP COLUMN "status",
ADD COLUMN     "status" "VotationStatus" NOT NULL DEFAULT E'UPCOMING';

-- DropEnum
DROP TYPE "Status";
