-- Remove old role enum column from User table if it exists
-- This migration removes the legacy role field and ensures userRoleId is properly set up

-- Drop index on role column if it exists
DROP INDEX IF EXISTS `User_role_idx` ON `User`;

-- Remove the old role column (enum) from User table
-- Note: This will fail silently if the column doesn't exist, which is fine
ALTER TABLE `User` DROP COLUMN IF EXISTS `role`;

-- Ensure userRoleId column exists (should already exist from previous migration)
-- This is a no-op if column already exists
ALTER TABLE `User` 
    ADD COLUMN IF NOT EXISTS `userRoleId` INTEGER NULL;

-- Ensure foreign key exists (should already exist from previous migration)
-- Drop and recreate to ensure it's correct
ALTER TABLE `User` DROP FOREIGN KEY IF EXISTS `User_userRoleId_fkey`;

ALTER TABLE `User` 
    ADD CONSTRAINT `User_userRoleId_fkey` 
    FOREIGN KEY (`userRoleId`) 
    REFERENCES `Role`(`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- Ensure index exists on userRoleId
CREATE INDEX IF NOT EXISTS `User_userRoleId_idx` ON `User`(`userRoleId`);

