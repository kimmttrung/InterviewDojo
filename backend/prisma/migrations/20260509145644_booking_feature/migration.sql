/*
  Warnings:

  - You are about to drop the column `price` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "price",
ADD COLUMN     "coaching_plan_id" INTEGER;

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

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_coaching_plan_id_fkey" FOREIGN KEY ("coaching_plan_id") REFERENCES "coaching_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaching_plans" ADD CONSTRAINT "coaching_plans_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentor_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
