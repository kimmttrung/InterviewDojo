/*
  Warnings:

  - A unique constraint covering the columns `[session_id,reviewer_id,reviewee_id]` on the table `feedbacks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deadline` to the `feedbacks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'SUBMITTED', 'LATE', 'SKIPPED');

-- AlterTable
ALTER TABLE "feedbacks" ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "quick_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submitted_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_session_id_reviewer_id_reviewee_id_key" ON "feedbacks"("session_id", "reviewer_id", "reviewee_id");
