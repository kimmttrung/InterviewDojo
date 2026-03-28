/*
  Warnings:

  - You are about to drop the column `category_id` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_time` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `sample_answer` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `target_role` on the `users` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[slug]` on the table `questions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `data` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_question` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `difficulty` on the `questions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "TypeQuestion" AS ENUM ('CODE', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'TECHNICAL');

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_category_id_fkey";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "category_id",
DROP COLUMN "content",
DROP COLUMN "estimated_time",
DROP COLUMN "sample_answer",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type_question" "TypeQuestion" NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "Difficulty" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "target_role",
ADD COLUMN     "target_role_id" INTEGER,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CANDIDATE';

-- CreateTable
CREATE TABLE "target_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "target_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_question" (
    "question_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "category_question_pkey" PRIMARY KEY ("question_id","category_id")
);

-- CreateTable
CREATE TABLE "target_role_question" (
    "target_role_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,

    CONSTRAINT "target_role_question_pkey" PRIMARY KEY ("target_role_id","question_id")
);

-- CreateTable
CREATE TABLE "user_questions" (
    "user_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_questions_pkey" PRIMARY KEY ("user_id","question_id")
);

-- CreateTable
CREATE TABLE "question_attempts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "score" DOUBLE PRECISION DEFAULT 0,
    "user_answer" JSONB,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "target_roles_name_key" ON "target_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "questions_slug_key" ON "questions"("slug");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_target_role_id_fkey" FOREIGN KEY ("target_role_id") REFERENCES "target_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_question" ADD CONSTRAINT "category_question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_question" ADD CONSTRAINT "category_question_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_role_question" ADD CONSTRAINT "target_role_question_target_role_id_fkey" FOREIGN KEY ("target_role_id") REFERENCES "target_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_role_question" ADD CONSTRAINT "target_role_question_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_questions" ADD CONSTRAINT "user_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_questions" ADD CONSTRAINT "user_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_attempts" ADD CONSTRAINT "question_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
