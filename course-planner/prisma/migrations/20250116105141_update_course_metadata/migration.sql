/*
  Warnings:

  - You are about to alter the column `credits` on the `Course` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `minGrade` on the `CoursePrerequisite` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `CourseSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `CourseSchedule` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CourseSchedule" DROP CONSTRAINT "CourseSchedule_courseId_fkey";

-- DropIndex
DROP INDEX "CourseSchedule_courseId_idx";

-- AlterTable
ALTER TABLE "AcademicPlan" ALTER COLUMN "savedCourses" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "credits" SET DATA TYPE INTEGER,
ALTER COLUMN "prerequisites" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "gradeDistribution" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CoursePrerequisite" DROP COLUMN "minGrade",
ADD COLUMN     "grade" TEXT,
ALTER COLUMN "type" SET DEFAULT 'required';

-- AlterTable
ALTER TABLE "CourseSchedule" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "CourseMetadata" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseMetadata_courseId_key" ON "CourseMetadata"("courseId");

-- AddForeignKey
ALTER TABLE "CourseSchedule" ADD CONSTRAINT "CourseSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseMetadata" ADD CONSTRAINT "CourseMetadata_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
