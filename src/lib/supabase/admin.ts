
import { createClient } from '@supabase/supabase-js';

// These values are only available on the server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL and service role key are required for admin client.');
}

// Create and export the Supabase admin client
// This client has elevated privileges and should only be used in server-side code (e.g., Server Actions, API routes).
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
