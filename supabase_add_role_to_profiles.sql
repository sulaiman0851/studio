ALTER TABLE profiles
ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;

-- Optional: Update existing users to 'user' role if needed
-- UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Optional: Grant admin role to a specific user (replace with actual user ID)
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_ADMIN_USER_ID';
