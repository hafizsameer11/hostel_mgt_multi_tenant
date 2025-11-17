-- Add type column (new field, no data conversion needed)
ALTER TABLE `Hostel` ADD COLUMN `type` JSON NULL;

-- Convert existing category VARCHAR to JSON array format
-- Step 1: Add temporary column for converted data
ALTER TABLE `Hostel` ADD COLUMN `category_new` JSON NULL;

-- Step 2: Convert existing VARCHAR category values to JSON array format
-- Map existing category values to new format (normalize to enum values)
UPDATE `Hostel` 
SET `category_new` = CASE
    WHEN `category` IS NULL OR `category` = '' THEN NULL
    WHEN LOWER(TRIM(`category`)) IN ('luxury_stage', 'luxury', 'luxurystage', 'luxury_stage_family', 'family_combine', 'combine', 'lurury_stage') THEN JSON_ARRAY('luxury')
    WHEN LOWER(TRIM(`category`)) IN ('back_pack', 'backpack', 'back pack', 'boy_and_girls_family', 'boy and girls, family', 'boys_and_girls_family') THEN JSON_ARRAY('back_pack')
    WHEN LOWER(TRIM(`category`)) IN ('home2', 'home_2', 'home-2', 'home 2', 'separate_hostel_girls_and_boys', 'separate hostel girls and boys') THEN JSON_ARRAY('home2')
    ELSE JSON_ARRAY(LOWER(TRIM(`category`)))
END
WHERE `category` IS NOT NULL;

-- Step 3: Drop the old category column
ALTER TABLE `Hostel` DROP COLUMN `category`;

-- Step 4: Rename the new column to category
ALTER TABLE `Hostel` CHANGE COLUMN `category_new` `category` JSON NULL;

