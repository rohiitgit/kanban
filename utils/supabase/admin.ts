import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase admin client with service_role key
 *
 * ⚠️ CRITICAL SECURITY WARNING ⚠️
 * This client has FULL ACCESS to your database, bypassing all RLS policies!
 * NEVER expose this client or the service_role key to the browser/client-side.
 * ONLY use this in server-side code (API routes, Server Components, Server Actions).
 *
 * Use cases:
 * - Admin operations (invite users, delete users, etc.)
 * - Bypassing RLS for system operations
 * - Bulk operations requiring elevated permissions
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Get it from Supabase Dashboard → Settings → API → service_role key'
    )
  }

  // Create admin client with service role key
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
