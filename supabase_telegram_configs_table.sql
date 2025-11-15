CREATE TABLE telegram_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  bot_token TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create a unique index that only applies to rows where is_active is TRUE
CREATE UNIQUE INDEX unique_active_telegram_config ON telegram_configs (is_active)
WHERE is_active = TRUE;

ALTER TABLE telegram_configs ENABLE ROW LEVEL SECURITY;

-- Admins can insert, update, and view configurations
CREATE POLICY "Admins can manage telegram configs." ON telegram_configs
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));