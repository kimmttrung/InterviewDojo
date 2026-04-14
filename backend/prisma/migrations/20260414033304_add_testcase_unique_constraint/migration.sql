/*
  Warnings:

  - A unique constraint covering the columns `[coding_question_id,order]` on the table `test_cases` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "test_cases_coding_question_id_order_key" ON "test_cases"("coding_question_id", "order");
