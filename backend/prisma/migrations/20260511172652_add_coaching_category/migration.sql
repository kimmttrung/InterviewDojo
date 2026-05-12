/*
  Warnings:

  - Added the required column `category_id` to the `coaching_plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "SlotStatus" ADD VALUE 'BOOKED';

-- AlterTable
ALTER TABLE "coaching_plans" ADD COLUMN     "category_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "coaching_categories" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaching_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coaching_categories_slug_key" ON "coaching_categories"("slug");

-- AddForeignKey
ALTER TABLE "coaching_plans" ADD CONSTRAINT "coaching_plans_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "coaching_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
