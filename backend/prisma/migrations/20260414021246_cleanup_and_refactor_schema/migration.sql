/*
  Warnings:

  - You are about to drop the column `question_id` on the `mock_sessions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "mock_sessions" DROP CONSTRAINT "mock_sessions_question_id_fkey";

-- AlterTable
ALTER TABLE "coding_questions" ADD COLUMN     "constraints" TEXT,
ADD COLUMN     "hints" TEXT[],
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "mock_sessions" DROP COLUMN "question_id";

-- AlterTable
ALTER TABLE "test_cases" ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "mock_session_questions" (
    "mock_session_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,

    CONSTRAINT "mock_session_questions_pkey" PRIMARY KEY ("mock_session_id","question_id")
);

-- CreateTable
CREATE TABLE "mock_session_coding_questions" (
    "mock_session_id" INTEGER NOT NULL,
    "coding_question_id" INTEGER NOT NULL,

    CONSTRAINT "mock_session_coding_questions_pkey" PRIMARY KEY ("mock_session_id","coding_question_id")
);

-- AddForeignKey
ALTER TABLE "mock_session_questions" ADD CONSTRAINT "mock_session_questions_mock_session_id_fkey" FOREIGN KEY ("mock_session_id") REFERENCES "mock_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_session_questions" ADD CONSTRAINT "mock_session_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_session_coding_questions" ADD CONSTRAINT "mock_session_coding_questions_mock_session_id_fkey" FOREIGN KEY ("mock_session_id") REFERENCES "mock_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_session_coding_questions" ADD CONSTRAINT "mock_session_coding_questions_coding_question_id_fkey" FOREIGN KEY ("coding_question_id") REFERENCES "coding_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
