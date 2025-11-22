-- Create telegram_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS telegram_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_token TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE telegram_configs ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists to avoid conflict
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON telegram_configs;

-- Allow read access to authenticated users (so the server function can read it if using auth client, though we use admin client)
CREATE POLICY "Allow read access to authenticated users" ON telegram_configs
  FOR SELECT TO authenticated USING (true);

-- Insert a placeholder row if empty (User needs to update this!)
INSERT INTO telegram_configs (bot_token, chat_id)
SELECT 'YOUR_BOT_TOKEN', 'YOUR_CHAT_ID'
WHERE NOT EXISTS (SELECT 1 FROM telegram_configs);
