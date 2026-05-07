/*
  Warnings:

  - The values [ACCEPTED,REJECTED,COMPLETED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [STAFF] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `mentor_id` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `bookings` table. All the data in the column will be lost.
  - The primary key for the `coding_questions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `coding_questions` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `coding_questions` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `coding_questions` table. All the data in the column will be lost.
  - You are about to drop the column `is_published` on the `coding_questions` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `coding_questions` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `coding_questions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `coding_questions` table. All the data in the column will be lost.
  - You are about to drop the column `communication` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `problem_solving` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `technical` on the `feedbacks` table. All the data in the column will be lost.
  - The primary key for the `mentor_profiles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `mentor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `interviewer_id` on the `mock_sessions` table. All the data in the column will be lost.
  - The `status` column on the `mock_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `data` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `type_question` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `user_skills` table. All the data in the column will be lost.
  - You are about to drop the `ai_analyses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `availabilities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `category_question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coding_category_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coding_question_bookmarks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coding_question_companies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coding_target_role_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mock_session_coding_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `question_attempts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `solo_recordings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `target_role_question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `target_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_questions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slot_id]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[booking_id]` on the table `mock_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slot_id` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question_id` to the `coding_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overall_score` to the `feedbacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `booking_id` to the `mock_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode` to the `mock_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `skills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `user_skills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time_use` to the `user_skills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SYSTEM_DESIGN', 'BEHAVIORAL', 'TECHNICAL', 'CODING');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('SOLO', 'MEET');

-- CreateEnum
CREATE TYPE "SkillType" AS ENUM ('SOFTSKILL', 'HARDSKILL', 'LANGUAGE');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('LEARNING', 'PRACTICED', 'PERSONAL_PROJECT', 'PRODUCTION_READY', 'EXPERT');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
ALTER TABLE "public"."bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('CANDIDATE', 'MENTOR', 'ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CANDIDATE';
COMMIT;

-- DropForeignKey
ALTER TABLE "ai_analyses" DROP CONSTRAINT "ai_analyses_session_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_analyses" DROP CONSTRAINT "ai_analyses_solo_recording_id_fkey";

-- DropForeignKey
ALTER TABLE "availabilities" DROP CONSTRAINT "availabilities_mentor_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_mentor_id_fkey";

-- DropForeignKey
ALTER TABLE "category_question" DROP CONSTRAINT "category_question_category_id_fkey";

-- DropForeignKey
ALTER TABLE "category_question" DROP CONSTRAINT "category_question_question_id_fkey";

-- DropForeignKey
ALTER TABLE "code_submissions" DROP CONSTRAINT "code_submissions_coding_question_id_fkey";

-- DropForeignKey
ALTER TABLE "code_submissions" DROP CONSTRAINT "code_submissions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "coding_category_questions" DROP CONSTRAINT "coding_category_questions_category_id_fkey";

-- DropForeignKey
ALTER TABLE "coding_category_questions" DROP CONSTRAINT "coding_category_questions_coding_question_id_fkey";

-- DropForeignKey
ALTER TABLE "coding_question_bookmarks" DROP CONSTRAINT "coding_question_bookmarks_coding_question_id_fkey";

-- DropForeignKey
ALTER TABLE "coding_question_bookmarks" DROP CONSTRAINT "coding_question_bookmarks_user_id_fkey";

-- DropForeignKey
ALTER TABLE "coding_question_companies" DROP CONSTRAINT "coding_question_companies_coding_question_id_fkey";

-- DropForeignKey
ALTER TABLE "coding_question_companies" DROP CONSTRAINT "coding_question_companies_company_id_fkey";

-- DropForeignKey
ALTER TABLE "coding_target_role_questions" DROP CONSTRAINT "coding_target_role_questions_coding_question_id_fkey";

-- DropForeignKey
ALTER TABLE "coding_target_role_questions" DROP CONSTRAINT "coding_target_role_questions_target_role_id_fkey";

-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_reviewer_id_fkey";

-- DropForeignKey
ALTER TABLE "mock_session_coding_questions" DROP CONSTRAINT "mock_session_coding_questions_coding_question_id_fkey";

-- DropForeignKey
ALTER TABLE "mock_session_coding_questions" DROP CONSTRAINT "mock_session_coding_questions_mock_session_id_fkey";

-- DropForeignKey
ALTER TABLE "mock_sessions" DROP CONSTRAINT "mock_sessions_interviewer_id_fkey";

-- DropForeignKey
ALTER TABLE "question_attempts" DROP CONSTRAINT "question_attempts_question_id_fkey";

-- DropForeignKey
ALTER TABLE "question_attempts" DROP CONSTRAINT "question_attempts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "solo_recordings" DROP CONSTRAINT "solo_recordings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "target_role_question" DROP CONSTRAINT "target_role_question_question_id_fkey";

-- DropForeignKey
ALTER TABLE "target_role_question" DROP CONSTRAINT "target_role_question_target_role_id_fkey";

-- DropForeignKey
ALTER TABLE "test_cases" DROP CONSTRAINT "test_cases_coding_question_id_fkey";

-- DropForeignKey
ALTER TABLE "user_questions" DROP CONSTRAINT "user_questions_question_id_fkey";

-- DropForeignKey
ALTER TABLE "user_questions" DROP CONSTRAINT "user_questions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_target_role_id_fkey";

-- DropIndex
DROP INDEX "coding_questions_slug_key";

-- DropIndex
DROP INDEX "mentor_profiles_user_id_key";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "mentor_id",
DROP COLUMN "start_time",
DROP COLUMN "updated_at",
ADD COLUMN     "slot_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "coding_questions" DROP CONSTRAINT "coding_questions_pkey",
DROP COLUMN "created_at",
DROP COLUMN "difficulty",
DROP COLUMN "id",
DROP COLUMN "is_published",
DROP COLUMN "slug",
DROP COLUMN "title",
DROP COLUMN "updated_at",
ADD COLUMN     "question_id" INTEGER NOT NULL,
ADD CONSTRAINT "coding_questions_pkey" PRIMARY KEY ("question_id");

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "industry" TEXT;

-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "communication",
DROP COLUMN "problem_solving",
DROP COLUMN "technical",
ADD COLUMN     "overall_score" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "strengths" JSONB,
ADD COLUMN     "suggestions" JSONB,
ADD COLUMN     "weaknesses" JSONB,
ALTER COLUMN "reviewer_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mentor_profiles" DROP CONSTRAINT "mentor_profiles_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "mentor_profiles_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "mock_sessions" DROP COLUMN "interviewer_id",
ADD COLUMN     "booking_id" INTEGER NOT NULL,
ADD COLUMN     "mode" "SessionMode" NOT NULL,
ALTER COLUMN "scheduled_at" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "data",
DROP COLUMN "type_question",
ADD COLUMN     "type" "QuestionType" NOT NULL,
ALTER COLUMN "difficulty" SET DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "skills" DROP COLUMN "category",
ADD COLUMN     "type" "SkillType" NOT NULL;

-- AlterTable
ALTER TABLE "user_skills" DROP COLUMN "score",
ADD COLUMN     "level" "SkillLevel" NOT NULL,
ADD COLUMN     "time_use" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "ai_analyses";

-- DropTable
DROP TABLE "availabilities";

-- DropTable
DROP TABLE "category_question";

-- DropTable
DROP TABLE "coding_category_questions";

-- DropTable
DROP TABLE "coding_question_bookmarks";

-- DropTable
DROP TABLE "coding_question_companies";

-- DropTable
DROP TABLE "coding_target_role_questions";

-- DropTable
DROP TABLE "mock_session_coding_questions";

-- DropTable
DROP TABLE "question_attempts";

-- DropTable
DROP TABLE "solo_recordings";

-- DropTable
DROP TABLE "target_role_question";

-- DropTable
DROP TABLE "target_roles";

-- DropTable
DROP TABLE "user_questions";

-- DropEnum
DROP TYPE "TypeQuestion";

-- CreateTable
CREATE TABLE "experiences" (
    "id" SERIAL NOT NULL,
    "mentor_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "job_role_id" INTEGER NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "job_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots" (
    "id" SERIAL NOT NULL,
    "mentor_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theory_questions" (
    "question_id" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "theory_questions_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "question_categories" (
    "question_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "question_categories_pkey" PRIMARY KEY ("question_id","category_id")
);

-- CreateTable
CREATE TABLE "question_job_roles" (
    "question_id" INTEGER NOT NULL,
    "job_role_id" INTEGER NOT NULL,

    CONSTRAINT "question_job_roles_pkey" PRIMARY KEY ("question_id","job_role_id")
);

-- CreateTable
CREATE TABLE "user_bookmarks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solo_sessions" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "script" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solo_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meet_sessions" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,

    CONSTRAINT "meet_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_roles_name_key" ON "job_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_bookmarks_user_id_question_id_key" ON "user_bookmarks"("user_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "solo_sessions_session_id_key" ON "solo_sessions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "meet_sessions_session_id_key" ON "meet_sessions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_slot_id_key" ON "bookings"("slot_id");

-- CreateIndex
CREATE INDEX "bookings_candidate_id_idx" ON "bookings"("candidate_id");

-- CreateIndex
CREATE UNIQUE INDEX "mock_sessions_booking_id_key" ON "mock_sessions"("booking_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_target_role_id_fkey" FOREIGN KEY ("target_role_id") REFERENCES "job_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentor_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theory_questions" ADD CONSTRAINT "theory_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_questions" ADD CONSTRAINT "coding_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_categories" ADD CONSTRAINT "question_categories_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_categories" ADD CONSTRAINT "question_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_job_roles" ADD CONSTRAINT "question_job_roles_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_job_roles" ADD CONSTRAINT "question_job_roles_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_coding_question_id_fkey" FOREIGN KEY ("coding_question_id") REFERENCES "coding_questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_submissions" ADD CONSTRAINT "code_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_submissions" ADD CONSTRAINT "code_submissions_coding_question_id_fkey" FOREIGN KEY ("coding_question_id") REFERENCES "coding_questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_sessions" ADD CONSTRAINT "mock_sessions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solo_sessions" ADD CONSTRAINT "solo_sessions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "mock_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_sessions" ADD CONSTRAINT "meet_sessions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "mock_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
