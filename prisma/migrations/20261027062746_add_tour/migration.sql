-- CreateEnum
CREATE TYPE "Persona" AS ENUM ('mortimer', 'historian', 'kid');

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "legendIds" TEXT[],
    "persona" "Persona" NOT NULL DEFAULT 'mortimer',
    "deleteCodeHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);
