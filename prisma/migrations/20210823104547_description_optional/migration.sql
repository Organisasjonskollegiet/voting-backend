-- AlterTable
ALTER TABLE "Meeting" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT E'UPCOMING';

-- AlterTable
ALTER TABLE "Votation" ALTER COLUMN "description" DROP NOT NULL;
