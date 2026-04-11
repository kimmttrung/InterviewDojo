/*
  Warnings:

  - You are about to drop the column `question_id` on the `mock_sessions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "mock_sessions" DROP CONSTRAINT "mock_sessions_question_id_fkey";

-- AlterTable
ALTER TABLE "mock_sessions" DROP COLUMN "question_id";

-- CreateTable
CREATE TABLE "_MockSessionToQuestion" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_MockSessionToQuestion_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MockSessionToQuestion_B_index" ON "_MockSessionToQuestion"("B");

-- AddForeignKey
ALTER TABLE "_MockSessionToQuestion" ADD CONSTRAINT "_MockSessionToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "mock_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MockSessionToQuestion" ADD CONSTRAINT "_MockSessionToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
