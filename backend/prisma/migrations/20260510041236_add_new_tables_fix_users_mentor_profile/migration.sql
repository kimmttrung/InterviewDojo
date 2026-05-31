/*
  Warnings:

  - The values [APPROVED] on the enum `ApprovalStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [CONFIRMED,CANCELLED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `price` on the `bookings` table. All the data in the column will be lost.
  - The primary key for the `mentor_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `certificate_url` on the `mentor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `cv_url` on the `mentor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `time_use` on the `user_skills` table. All the data in the column will be lost.
  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[user_id]` on the table `mentor_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `coaching_plan_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mentor_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `snapshot_plan_title` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `headline` to the `mentor_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `mock_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experience_months` to the `user_skills` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SlotRecurrentType" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "CoachingQuestionType" AS ENUM ('TEXT', 'FILE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('WAITING', 'MATCHED', 'CANCELLED', 'EXPIRED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MatchStrategy" AS ENUM ('RANDOM', 'SKILL', 'RATING');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('VNPAY', 'MOMO', 'STRIPE', 'PAYPAL');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'VND', 'JPY');

-- CreateEnum
CREATE TYPE "SessionSource" AS ENUM ('MENTOR_BOOKING', 'P2P_MATCH', 'SOLO');

-- AlterEnum
BEGIN;
CREATE TYPE "ApprovalStatus_new" AS ENUM ('INCOMPLETE', 'ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED');
ALTER TABLE "public"."mentor_profiles" ALTER COLUMN "approval_status" DROP DEFAULT;
ALTER TABLE "mentor_profiles" ALTER COLUMN "approval_status" TYPE "ApprovalStatus_new" USING ("approval_status"::text::"ApprovalStatus_new");
ALTER TYPE "ApprovalStatus" RENAME TO "ApprovalStatus_old";
ALTER TYPE "ApprovalStatus_new" RENAME TO "ApprovalStatus";
DROP TYPE "public"."ApprovalStatus_old";
ALTER TABLE "mentor_profiles" ALTER COLUMN "approval_status" SET DEFAULT 'INCOMPLETE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
ALTER TABLE "public"."bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "experiences" DROP CONSTRAINT "experiences_mentor_id_fkey";

-- DropForeignKey
ALTER TABLE "mock_sessions" DROP CONSTRAINT "mock_sessions_booking_id_fkey";

-- DropIndex
DROP INDEX "bookings_candidate_id_idx";

-- DropIndex
DROP INDEX "mock_sessions_booking_id_key";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "price",
ADD COLUMN     "coaching_plan_id" INTEGER NOT NULL,
ADD COLUMN     "mentor_id" INTEGER NOT NULL,
ADD COLUMN     "snapshot_plan_description" TEXT,
ADD COLUMN     "snapshot_plan_duration" INTEGER,
ADD COLUMN     "snapshot_plan_price" DOUBLE PRECISION,
ADD COLUMN     "snapshot_plan_title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "mentor_profiles" DROP CONSTRAINT "mentor_profiles_pkey",
DROP COLUMN "certificate_url",
DROP COLUMN "cv_url",
ADD COLUMN     "headline" TEXT NOT NULL,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "introdcution_video_url" TEXT,
ALTER COLUMN "approval_status" SET DEFAULT 'INCOMPLETE',
ADD CONSTRAINT "mentor_profiles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "mock_sessions" ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "match_id" INTEGER,
ADD COLUMN     "source" "SessionSource" NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "booking_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "slots" ADD COLUMN     "recurrent_type" "SlotRecurrentType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "recurrent_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_skills" DROP COLUMN "time_use",
ADD COLUMN     "experience_months" INTEGER NOT NULL,
ADD COLUMN     "proof_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "github_link" TEXT,
ADD COLUMN     "linkedIn_link" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "mentor_approval_logs" (
    "id" SERIAL NOT NULL,
    "mentor_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "status_before" TEXT NOT NULL,
    "status_after" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_action_logs" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "status_before" TEXT,
    "status_after" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_plans" (
    "id" SERIAL NOT NULL,
    "mentor_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaching_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_plan_questions" (
    "id" SERIAL NOT NULL,
    "coaching_plan_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "type" "CoachingQuestionType" NOT NULL,
    "placeholder" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coaching_plan_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaching_plan_answers" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "answer_text" TEXT,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coaching_plan_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "candidate_a_id" INTEGER NOT NULL,
    "candidate_b_id" INTEGER NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'WAITING',
    "strategy" "MatchStrategy" NOT NULL,
    "match_score" DOUBLE PRECISION,
    "matched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_transaction_id" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coaching_plan_answers_booking_id_question_id_key" ON "coaching_plan_answers"("booking_id", "question_id");

-- CreateIndex
CREATE INDEX "matches_candidate_a_id_candidate_b_id_idx" ON "matches"("candidate_a_id", "candidate_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "matches_candidate_a_id_candidate_b_id_key" ON "matches"("candidate_a_id", "candidate_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_profiles_user_id_key" ON "mentor_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "mentor_approval_logs" ADD CONSTRAINT "mentor_approval_logs_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_approval_logs" ADD CONSTRAINT "mentor_approval_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_coaching_plan_id_fkey" FOREIGN KEY ("coaching_plan_id") REFERENCES "coaching_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_action_logs" ADD CONSTRAINT "booking_action_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_action_logs" ADD CONSTRAINT "booking_action_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_plans" ADD CONSTRAINT "coaching_plans_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_plan_questions" ADD CONSTRAINT "coaching_plan_questions_coaching_plan_id_fkey" FOREIGN KEY ("coaching_plan_id") REFERENCES "coaching_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_plan_answers" ADD CONSTRAINT "coaching_plan_answers_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_plan_answers" ADD CONSTRAINT "coaching_plan_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "coaching_plan_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_candidate_a_id_fkey" FOREIGN KEY ("candidate_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_candidate_b_id_fkey" FOREIGN KEY ("candidate_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_sessions" ADD CONSTRAINT "mock_sessions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_sessions" ADD CONSTRAINT "mock_sessions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
