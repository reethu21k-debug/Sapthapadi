// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

// True admin / service-role client. This must NOT go through the cookie-based
// createServerClient flow — that helper reads the caller's session from
// cookies and authenticates requests as that user, which means the service
// role key you pass in only ends up used for the `apikey` header while the
// actual `Authorization` bearer token still comes from the logged-in user's
// session. That means every "admin" query was still subject to normal RLS
// policies instead of bypassing them, which is why writes like assigning a
// subscription could silently fail with a row-level-security violation.
//
// Using the plain supabase-js client with persistSession/autoRefreshToken
// disabled means this client only ever authenticates via the service role
// key, giving it real RLS-bypass privileges.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}