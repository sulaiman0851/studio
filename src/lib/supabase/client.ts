import { createClient } from '@supabase/supabase-js';

// Ambil variabel environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Pastikan variabel environment ada
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anonymous key are required.');
}

// Buat dan ekspor Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
