/*
  Warnings:

  - The values [PENDING] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUCCESS] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `status` on the `slots` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'PAYMENT', 'REFUND', 'PAYOUT', 'PLATFORM_FEE');

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING_PAYMENT', 'PENDING_ACCEPTANCE', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'REFUNDED');
ALTER TABLE "public"."bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'INTERNAL_WALLET';

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'EXPIRED');
ALTER TABLE "public"."payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_slot_id_fkey";

-- DropIndex
DROP INDEX "bookings_slot_id_key";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "hold_expires_at" TIMESTAMP(3),
ADD COLUMN     "mentor_response_deadline" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT',
ALTER COLUMN "slot_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "refunded_amount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "refunded_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "slots" DROP COLUMN "status",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "SlotStatus";

-- CreateTable
CREATE TABLE "blocked_events" (
    "id" SERIAL NOT NULL,
    "mentor_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance_before" DOUBLE PRECISION NOT NULL,
    "balance_after" DOUBLE PRECISION NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blocked_events_mentor_id_start_time_end_time_idx" ON "blocked_events"("mentor_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_idx" ON "wallet_transactions"("user_id");

-- CreateIndex
CREATE INDEX "bookings_mentor_id_start_time_end_time_idx" ON "bookings"("mentor_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "slots_mentor_id_start_time_end_time_idx" ON "slots"("mentor_id", "start_time", "end_time");

-- AddForeignKey
ALTER TABLE "blocked_events" ADD CONSTRAINT "blocked_events_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
