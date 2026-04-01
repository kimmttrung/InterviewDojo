-- CreateTable
CREATE TABLE "solo_recordings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "video_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solo_recordings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "solo_recordings" ADD CONSTRAINT "solo_recordings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
