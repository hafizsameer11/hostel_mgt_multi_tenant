/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Hostel` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `hostel` MODIFY `name` VARCHAR(255) NULL,
    MODIFY `address` JSON NULL,
    MODIFY `totalFloors` INTEGER NULL DEFAULT 0,
    MODIFY `totalRooms` INTEGER NULL DEFAULT 0,
    MODIFY `totalBeds` INTEGER NULL DEFAULT 0,
    MODIFY `occupiedBeds` INTEGER NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX `Hostel_name_key` ON `Hostel`(`name`);
