-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('USER', 'SYSTEM', 'QUESTION');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('HARASSMENT', 'SCAM', 'FAKE_PROFILE', 'NO_SHOW', 'CHEATING', 'PAYMENT_OUTSIDE', 'ROOM_CREATION_FAILED', 'PAYMENT_ERROR', 'MATCHING_ERROR', 'OTHER_SYSTEM', 'WRONG_ANSWER', 'INAPPROPRIATE_CONTENT', 'DUPLICATE', 'OTHER_QUESTION');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARNING', 'TEMP_BAN', 'PERMANENT_BAN', 'UNBAN', 'SUSPEND_MENTOR', 'RESTORE_MENTOR', 'REJECT_REPORT', 'REMOVE_QUESTION');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ban_reason" TEXT,
ADD COLUMN     "banned_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_reports" (
    "id" SERIAL NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "type" "ReportType" NOT NULL,
    "target_type" "ReportTargetType" NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "admin_note" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "target_user_id" INTEGER,
    "target_question_id" INTEGER,
    "snapshot_question_title" TEXT,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_logs" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER,
    "admin_id" INTEGER NOT NULL,
    "target_user_id" INTEGER,
    "action" "ModerationActionType" NOT NULL,
    "reason" TEXT,
    "banned_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_reports_status_idx" ON "user_reports"("status");

-- CreateIndex
CREATE INDEX "user_reports_target_type_idx" ON "user_reports"("target_type");

-- CreateIndex
CREATE INDEX "user_reports_target_user_id_idx" ON "user_reports"("target_user_id");

-- CreateIndex
CREATE INDEX "user_reports_created_at_idx" ON "user_reports"("created_at");

-- CreateIndex
CREATE INDEX "moderation_logs_target_user_id_idx" ON "moderation_logs"("target_user_id");

-- CreateIndex
CREATE INDEX "moderation_logs_admin_id_idx" ON "moderation_logs"("admin_id");

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_target_question_id_fkey" FOREIGN KEY ("target_question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "user_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
