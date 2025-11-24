-- Performance optimization: Add indexes for frequently queried columns
-- This will significantly speed up dashboard queries

-- Index for jobs.created_at (used in all time-based queries)
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Index for jobs.created_by (used in user-specific queries and daily active users)
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);

-- Index for jobs.assigned_to (used in job filtering)
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);

-- Composite index for jobs filtering by user and date
CREATE INDEX IF NOT EXISTS idx_jobs_user_date ON jobs(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_date ON jobs(assigned_to, created_at DESC);

-- Index for geotagged_photos.user_id and created_at (used in geotag gallery)
CREATE INDEX IF NOT EXISTS idx_geotagged_photos_user_created ON geotagged_photos(user_id, created_at DESC);

-- Index for profiles.id (for faster joins)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Analyze tables to update statistics for query planner
ANALYZE jobs;
ANALYZE geotagged_photos;
ANALYZE profiles;
