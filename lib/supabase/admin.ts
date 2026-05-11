import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern for better performance
let adminClient: SupabaseClient | null = null

/**
 * Admin client for server-side API routes that need direct database access
 * without user authentication context (e.g., fetching materials for analysis)
 * Uses singleton pattern for performance
 */
export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[Admin Client] Missing env vars:", { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseServiceKey 
    })
    throw new Error("Missing Supabase environment variables for admin client")
  }
  
  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  return adminClient
}
