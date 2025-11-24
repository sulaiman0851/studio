-- Add file_path column to geotagged_photos table
-- This allows us to properly delete files from Supabase storage

ALTER TABLE geotagged_photos 
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_geotagged_photos_file_path 
ON geotagged_photos(file_path);

-- Add comment to document the column
COMMENT ON COLUMN geotagged_photos.file_path IS 'Storage path for the photo file (e.g., user_id/filename.jpg)';
