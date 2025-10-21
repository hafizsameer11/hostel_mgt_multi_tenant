/*
  Warnings:

  - You are about to drop the column `floorId` on the `bed` table. All the data in the column will be lost.
  - You are about to drop the column `hostelId` on the `bed` table. All the data in the column will be lost.
  - You are about to drop the column `dimensions` on the `room` table. All the data in the column will be lost.
  - You are about to drop the column `hasBalcony` on the `room` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `room` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `bed` DROP FOREIGN KEY `Bed_floorId_fkey`;

-- DropForeignKey
ALTER TABLE `bed` DROP FOREIGN KEY `Bed_hostelId_fkey`;

-- DropIndex
DROP INDEX `Bed_floorId_idx` ON `bed`;

-- DropIndex
DROP INDEX `Bed_hostelId_idx` ON `bed`;

-- AlterTable
ALTER TABLE `bed` DROP COLUMN `floorId`,
    DROP COLUMN `hostelId`;

-- AlterTable
ALTER TABLE `room` DROP COLUMN `dimensions`,
    DROP COLUMN `hasBalcony`,
    DROP COLUMN `images`;
