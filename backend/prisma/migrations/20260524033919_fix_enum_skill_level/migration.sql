/*
  Warnings:

  - The values [LEARNING,PRACTICED,PERSONAL_PROJECT,PRODUCTION_READY,EXPERT] on the enum `SkillLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SkillLevel_new" AS ENUM ('AWARENESS', 'FOUNDATION', 'AUTONOMOUS', 'FLUENT', 'LEADERSHIP');
ALTER TABLE "user_skills" ALTER COLUMN "level" TYPE "SkillLevel_new" USING ("level"::text::"SkillLevel_new");
ALTER TYPE "SkillLevel" RENAME TO "SkillLevel_old";
ALTER TYPE "SkillLevel_new" RENAME TO "SkillLevel";
DROP TYPE "public"."SkillLevel_old";
COMMIT;
