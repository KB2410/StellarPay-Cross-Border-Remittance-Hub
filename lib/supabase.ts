import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function assertConfigured(name: string, value: string) {
  if (!value || value === 'xxx') {
    throw new Error(`${name} is not configured`);
  }
}

export function createClient() {
  assertConfigured('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl);
  assertConfigured('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey);

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createAdminClient() {
  assertConfigured('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl);
  assertConfigured('SUPABASE_SERVICE_ROLE_KEY', supabaseServiceKey);

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
