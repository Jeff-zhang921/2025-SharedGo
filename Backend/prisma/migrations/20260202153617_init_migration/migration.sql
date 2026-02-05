-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Physical_Activities', 'Festivals', 'Educational', 'Networking', 'Arts_Culture', 'Food_Drink', 'Music_Concerts', 'Tech_Gaming', 'Wellness_Meditation', 'Volunteer_Charity', 'Other');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'Other',
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL DEFAULT 0;
