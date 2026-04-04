/*
  Warnings:

  - A unique constraint covering the columns `[solo_recording_id]` on the table `ai_analyses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ai_analyses" ADD COLUMN     "solo_recording_id" INTEGER,
ALTER COLUMN "session_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ai_analyses_solo_recording_id_key" ON "ai_analyses"("solo_recording_id");

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_solo_recording_id_fkey" FOREIGN KEY ("solo_recording_id") REFERENCES "solo_recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
