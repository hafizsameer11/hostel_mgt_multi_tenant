-- Remove old role enum column from User table
-- This migration removes the legacy role field and ensures userRoleId is properly set up

-- Drop index on role column if it exists
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'User' 
               AND index_name = 'User_role_idx');
SET @sqlstmt := IF(@exist > 0, 'DROP INDEX `User_role_idx` ON `User`', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if role column exists and remove it
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'User' 
               AND column_name = 'role');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE `User` DROP COLUMN `role`', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure userRoleId column exists (should already exist from previous migration)
-- Check if column exists before adding
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'User' 
               AND column_name = 'userRoleId');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `User` ADD COLUMN `userRoleId` INTEGER NULL', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop foreign key if it exists and recreate it
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'User' 
               AND constraint_name = 'User_userRoleId_fkey');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE `User` DROP FOREIGN KEY `User_userRoleId_fkey`', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint
ALTER TABLE `User` 
    ADD CONSTRAINT `User_userRoleId_fkey` 
    FOREIGN KEY (`userRoleId`) 
    REFERENCES `Role`(`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- Ensure index exists on userRoleId
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'User' 
               AND index_name = 'User_userRoleId_idx');
SET @sqlstmt := IF(@exist = 0, 'CREATE INDEX `User_userRoleId_idx` ON `User`(`userRoleId`)', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
