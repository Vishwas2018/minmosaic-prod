import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars.\n\n' +
    '1. Run: supabase start\n' +
    '2. Run: supabase status\n' +
    '3. Copy API URL + anon key into apps/web/.env.local\n' +
    '4. Restart dev server (pnpm dev)\n\n' +
    'See apps/web/.env.local.example for template.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
