-- Rename 'name' column to 'roleName' in Role table if it exists
-- This migration handles the case where the database still has 'name' column

-- Check if 'name' column exists and 'roleName' doesn't exist
SET @nameExists := (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'Role' 
                    AND column_name = 'name');
SET @roleNameExists := (SELECT COUNT(*) FROM information_schema.columns 
                        WHERE table_schema = DATABASE() 
                        AND table_name = 'Role' 
                        AND column_name = 'roleName');

-- If 'name' exists and 'roleName' doesn't, rename the column
SET @sqlstmt := IF(@nameExists > 0 AND @roleNameExists = 0, 
    'ALTER TABLE `Role` CHANGE COLUMN `name` `roleName` VARCHAR(100) NOT NULL', 
    'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update indexes if needed
-- Drop old index on 'name' if it exists
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'Role' 
               AND index_name = 'Role_name_idx');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE `Role` DROP INDEX `Role_name_idx`', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create index on roleName if it doesn't exist
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'Role' 
               AND index_name = 'Role_roleName_idx');
SET @sqlstmt := IF(@exist = 0, 'CREATE INDEX `Role_roleName_idx` ON `Role`(`roleName`)', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update unique constraint if needed
-- Drop old unique constraint on 'name' if it exists
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'Role' 
               AND constraint_name = 'Role_name_key');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE `Role` DROP INDEX `Role_name_key`', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop old composite unique constraint if it exists
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'Role' 
               AND constraint_name = 'Role_name_userId_key');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE `Role` DROP INDEX `Role_name_userId_key`', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create composite unique constraint on (roleName, userId) if it doesn't exist
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'Role' 
               AND constraint_name = 'Role_roleName_userId_key');
SET @sqlstmt := IF(@exist = 0, 
    'CREATE UNIQUE INDEX `Role_roleName_userId_key` ON `Role`(`roleName`, `userId`)', 
    'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


