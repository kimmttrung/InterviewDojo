-- CreateTable
CREATE TABLE "candidate_recommendations" (
    "candidate_id" INTEGER NOT NULL,
    "mentor_id" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_recommendations_pkey" PRIMARY KEY ("candidate_id","mentor_id")
);

-- CreateIndex
CREATE INDEX "candidate_recommendations_candidate_id_rank_idx" ON "candidate_recommendations"("candidate_id", "rank");

-- AddForeignKey
ALTER TABLE "candidate_recommendations" ADD CONSTRAINT "candidate_recommendations_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_recommendations" ADD CONSTRAINT "candidate_recommendations_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
