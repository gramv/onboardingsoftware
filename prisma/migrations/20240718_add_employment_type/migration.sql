-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN "employment_type" "EmploymentType" NOT NULL DEFAULT 'full_time';