-- Add isAdmin field to User table (if not exists)
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'User' 
               AND column_name = 'isAdmin');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `User` ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add userId to Role table (if not exists)
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'Role' 
               AND column_name = 'userId');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE `Role` ADD COLUMN `userId` INTEGER NULL', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop the unique constraint on Role.name (we'll add a composite unique constraint)
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'Role' 
               AND constraint_name = 'Role_name_key');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE `Role` DROP INDEX `Role_name_key`', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add composite unique constraint on (name, userId)
CREATE UNIQUE INDEX IF NOT EXISTS `Role_name_userId_key` ON `Role`(`name`, `userId`);

-- Add index on userId in Role table
CREATE INDEX IF NOT EXISTS `Role_userId_idx` ON `Role`(`userId`);

-- Add foreign key from Role to User (for userId)
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'Role' 
               AND constraint_name = 'Role_userId_fkey');
SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE `Role` ADD CONSTRAINT `Role_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE', 
    'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remove admin role from Role table if it exists (check both name and roleName columns)
SET @nameExists := (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'Role' 
                    AND column_name = 'name');
SET @roleNameExists := (SELECT COUNT(*) FROM information_schema.columns 
                        WHERE table_schema = DATABASE() 
                        AND table_name = 'Role' 
                        AND column_name = 'roleName');
SET @sqlstmt := IF(@nameExists > 0, 
    'DELETE FROM `Role` WHERE `name` = ''admin''', 
    IF(@roleNameExists > 0, 
        'DELETE FROM `Role` WHERE `roleName` = ''admin''', 
        'SELECT 1'));
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index on isAdmin for faster queries
CREATE INDEX IF NOT EXISTS `User_isAdmin_idx` ON `User`(`isAdmin`);

