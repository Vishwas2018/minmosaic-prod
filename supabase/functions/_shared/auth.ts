// supabase/functions/_shared/auth.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0';

export interface AuthResult {
  user: { id: string; email?: string };
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/**
 * Validates the caller JWT from the Authorization header.
 * Uses anon key + forwarded Authorization header.
 */
export async function authenticateRequest(req: Request): Promise<AuthResult | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('Auth failed: missing/invalid Authorization header');
    return null;
  }

  const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log('authenticateRequest result', {
    hasAuthHeader: !!authHeader,
    userId: user?.id ?? null,
    error: error?.message ?? null,
  });

  if (error || !user) {
    return null;
  }

  return { user: { id: user.id, email: user.email ?? undefined } };
}

/**
 * Service-role client for privileged DB operations.
 */
export function createServiceClient() {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
