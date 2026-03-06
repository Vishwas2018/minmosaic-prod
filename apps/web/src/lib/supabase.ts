import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase env vars.\n\n' +
    '1. Create apps/web/.env.local\n' +
    '2. Set VITE_SUPABASE_URL to your cloud project URL\n' +
    '3. Set VITE_SUPABASE_PUBLISHABLE_KEY to your cloud publishable key\n' +
    '4. Restart the dev server (pnpm dev)\n\n' +
    'See apps/web/.env.local.example for template.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
