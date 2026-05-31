-- CreateEnum
CREATE TYPE "MentorPayoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED', 'FAILED');

-- AlterTable
ALTER TABLE "wallet_transactions" ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "mentor_payouts" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "mentor_id" INTEGER NOT NULL,
    "candidate_id" INTEGER NOT NULL,
    "gross_amount" DOUBLE PRECISION NOT NULL,
    "platform_fee_percent" DOUBLE PRECISION NOT NULL,
    "platform_fee_amount" DOUBLE PRECISION NOT NULL,
    "mentor_earning" DOUBLE PRECISION NOT NULL,
    "refundable_amount" DOUBLE PRECISION NOT NULL,
    "status" "MentorPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_admin_id" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "reject_reason" TEXT,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mentor_payouts_session_id_key" ON "mentor_payouts"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_payouts_booking_id_key" ON "mentor_payouts"("booking_id");

-- CreateIndex
CREATE INDEX "mentor_payouts_status_created_at_idx" ON "mentor_payouts"("status", "created_at");

-- CreateIndex
CREATE INDEX "mentor_payouts_mentor_id_idx" ON "mentor_payouts"("mentor_id");

-- CreateIndex
CREATE INDEX "mentor_payouts_candidate_id_idx" ON "mentor_payouts"("candidate_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_reference_id_idx" ON "wallet_transactions"("reference_id");

-- AddForeignKey
ALTER TABLE "mentor_payouts" ADD CONSTRAINT "mentor_payouts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "mock_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_payouts" ADD CONSTRAINT "mentor_payouts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_payouts" ADD CONSTRAINT "mentor_payouts_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_payouts" ADD CONSTRAINT "mentor_payouts_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_payouts" ADD CONSTRAINT "mentor_payouts_reviewed_by_admin_id_fkey" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_user_id_fkey";

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
