-- Add type column (new field, no data conversion needed)
ALTER TABLE `Hostel` ADD COLUMN `type` JSON NULL;

-- Add category column as JSON (new field, no conversion needed since column didn't exist before)
ALTER TABLE `Hostel` ADD COLUMN `category` JSON NULL;

