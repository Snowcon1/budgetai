import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Resolve the rate-limit identifier for a request:
 *   1. If the Authorization header contains a valid user JWT → 'user:<uuid>'
 *   2. Otherwise fall back to the client IP → 'ip:<address>'
 *
 * This means authenticated users get per-account limits while
 * unauthenticated / demo users are limited per IP.
 */
export async function resolveIdentifier(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      const { data: { user } } = await supabaseAuth.auth.getUser(token);
      if (user?.id) return `user:${user.id}`;
    } catch { /* fall through to IP */ }
  }

  // x-forwarded-for may be a comma-separated list; take the first (real client) IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  return `ip:${ip}`;
}

/**
 * Atomically increment today's usage counter and return whether the request
 * should be allowed.
 *
 * The counter is ALWAYS incremented first (fail-closed counting).  If the DB
 * call itself fails we fail open so a transient DB hiccup doesn't break the
 * feature for real users.
 *
 * @param serviceClient  Supabase client initialised with the service-role key
 * @param identifier     Value returned by resolveIdentifier()
 * @param feature        'chat' | 'receipt' | 'categorize'
 * @param dailyLimit     Max requests allowed per calendar day
 * @returns true = allow, false = block
 */
export async function checkRateLimit(
  serviceClient: ReturnType<typeof createClient>,
  identifier: string,
  feature: string,
  dailyLimit: number
): Promise<boolean> {
  try {
    const { data, error } = await serviceClient.rpc('increment_usage', {
      p_identifier: identifier,
      p_feature: feature,
    });
    if (error) return true; // DB error → fail open, don't punish real users
    return (data as number) <= dailyLimit;
  } catch {
    return true; // Network/unexpected error → fail open
  }
}
