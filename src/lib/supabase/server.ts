import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  // Debug logging – appears in server console
  console.log('🔧 createAdminClient – env vars:', {
    supabaseUrl: supabaseUrl ? '✅' : '❌ missing',
    supabaseServiceRoleKey: supabaseServiceRoleKey ? '✅' : '❌ missing',
  });

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    throw new Error(`Missing Supabase environment variables for admin client: ${missing.join(', ')}`);
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false, // Admin client typically doesn't need to persist sessions
    },
  });
}

