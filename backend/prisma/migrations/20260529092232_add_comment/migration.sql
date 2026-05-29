-- AlterEnum
ALTER TYPE "ReportTargetType" ADD VALUE 'COMMENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReportType" ADD VALUE 'SPAM';
ALTER TYPE "ReportType" ADD VALUE 'HATE_SPEECH';
ALTER TYPE "ReportType" ADD VALUE 'HARASSMENT_COMMENT';

-- AlterTable
ALTER TABLE "user_reports" ADD COLUMN     "target_comment_id" INTEGER;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_target_comment_id_fkey" FOREIGN KEY ("target_comment_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
