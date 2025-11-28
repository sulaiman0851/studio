ALTER TABLE profiles
ADD CONSTRAINT username_format_check
CHECK (username ~ '^[a-zA-Z0-9_-]+$');
