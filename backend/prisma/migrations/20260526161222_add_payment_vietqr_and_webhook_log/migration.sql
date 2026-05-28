/*
  Warnings:

  - A unique constraint covering the columns `[order_code]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[provider,provider_transaction_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_code` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'VIETQR';

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_booking_id_fkey";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "expired_at" TIMESTAMP(3),
ADD COLUMN     "order_code" TEXT NOT NULL,
ADD COLUMN     "user_id" INTEGER,
ALTER COLUMN "booking_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "payment_webhook_logs" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_code_key" ON "payments"("order_code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_provider_transaction_id_key" ON "payments"("provider", "provider_transaction_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
