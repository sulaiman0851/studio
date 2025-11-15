CREATE TABLE job_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  customer_name TEXT,
  type_modem_ont TEXT,
  serial_number TEXT,
  power_rx TEXT,
  pppoe_username TEXT,
  pppoe_password TEXT,
  default_ssid TEXT,
  new_ssid_wlan_key TEXT,
  reason TEXT
);

ALTER TABLE job_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own job entries." ON job_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own job entries." ON job_entries
  FOR SELECT USING (auth.uid() = user_id);
