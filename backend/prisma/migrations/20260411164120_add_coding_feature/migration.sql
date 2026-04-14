/*
  Warnings:

  - The values [CODE] on the enum `TypeQuestion` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'COMPILING', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILE_ERROR');

-- AlterEnum
BEGIN;
CREATE TYPE "TypeQuestion_new" AS ENUM ('BEHAVIORAL', 'SYSTEM_DESIGN', 'TECHNICAL');
ALTER TABLE "questions" ALTER COLUMN "type_question" TYPE "TypeQuestion_new" USING ("type_question"::text::"TypeQuestion_new");
ALTER TYPE "TypeQuestion" RENAME TO "TypeQuestion_old";
ALTER TYPE "TypeQuestion_new" RENAME TO "TypeQuestion";
DROP TYPE "public"."TypeQuestion_old";
COMMIT;

-- CreateTable
CREATE TABLE "coding_questions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "time_limit" INTEGER NOT NULL DEFAULT 2000,
    "memory_limit" INTEGER NOT NULL DEFAULT 256000,
    "codeforces_link" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coding_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" SERIAL NOT NULL,
    "coding_question_id" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "expected_output" TEXT NOT NULL,
    "is_sample" BOOLEAN NOT NULL DEFAULT false,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_submissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "coding_question_id" INTEGER NOT NULL,
    "language_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "source_code" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "verdict" TEXT,
    "score" DOUBLE PRECISION DEFAULT 0,
    "passed_test_cases" INTEGER,
    "total_test_cases" INTEGER,
    "execution_time" DOUBLE PRECISION,
    "memory_used" INTEGER,
    "error_message" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "judged_at" TIMESTAMP(3),

    CONSTRAINT "code_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coding_category_questions" (
    "coding_question_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "coding_category_questions_pkey" PRIMARY KEY ("coding_question_id","category_id")
);

-- CreateTable
CREATE TABLE "coding_target_role_questions" (
    "coding_question_id" INTEGER NOT NULL,
    "target_role_id" INTEGER NOT NULL,

    CONSTRAINT "coding_target_role_questions_pkey" PRIMARY KEY ("coding_question_id","target_role_id")
);

-- CreateTable
CREATE TABLE "coding_question_companies" (
    "coding_question_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,

    CONSTRAINT "coding_question_companies_pkey" PRIMARY KEY ("coding_question_id","company_id")
);

-- CreateTable
CREATE TABLE "coding_question_bookmarks" (
    "user_id" INTEGER NOT NULL,
    "coding_question_id" INTEGER NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coding_question_bookmarks_pkey" PRIMARY KEY ("user_id","coding_question_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coding_questions_slug_key" ON "coding_questions"("slug");

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_coding_question_id_fkey" FOREIGN KEY ("coding_question_id") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_submissions" ADD CONSTRAINT "code_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_submissions" ADD CONSTRAINT "code_submissions_coding_question_id_fkey" FOREIGN KEY ("coding_question_id") REFERENCES "coding_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_category_questions" ADD CONSTRAINT "coding_category_questions_coding_question_id_fkey" FOREIGN KEY ("coding_question_id") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_category_questions" ADD CONSTRAINT "coding_category_questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_target_role_questions" ADD CONSTRAINT "coding_target_role_questions_coding_question_id_fkey" FOREIGN KEY ("coding_question_id") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_target_role_questions" ADD CONSTRAINT "coding_target_role_questions_target_role_id_fkey" FOREIGN KEY ("target_role_id") REFERENCES "target_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_question_companies" ADD CONSTRAINT "coding_question_companies_coding_question_id_fkey" FOREIGN KEY ("coding_question_id") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_question_companies" ADD CONSTRAINT "coding_question_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_question_bookmarks" ADD CONSTRAINT "coding_question_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coding_question_bookmarks" ADD CONSTRAINT "coding_question_bookmarks_coding_question_id_fkey" FOREIGN KEY ("coding_question_id") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
