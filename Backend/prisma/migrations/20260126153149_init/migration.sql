/*
  Warnings:

  - Added the required column `latitude` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Physical_Activities', 'Festivals', 'Educational', 'Networking', 'Arts_Culture', 'Food_Drink', 'Music_Concerts', 'Tech_Gaming', 'Wellness_Meditation', 'Volunteer_Charity', 'Other');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'Other',
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL;
