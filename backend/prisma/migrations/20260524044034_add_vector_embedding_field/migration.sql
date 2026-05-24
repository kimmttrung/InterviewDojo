/*
  Warnings:

  - You are about to drop the column `introdcution_video_url` on the `mentor_profiles` table. All the data in the column will be lost.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "mentor_profiles" DROP COLUMN "introdcution_video_url",
ADD COLUMN     "introduction_video_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "embedding_vector" vector(1024);
