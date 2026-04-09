import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'

let client: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (client) return client
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[v0] Supabase credentials not configured')
    // Return a mock client that won't crash but won't work for real auth
    return {
      auth: {
        signInWithPassword: async () => ({ data: { session: null, user: null }, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: { session: null, user: null }, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), order: async () => ({ data: [], error: null }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: async () => ({ data: null, error: null }) }),
      }),
    } as unknown as SupabaseClient
  }
  
  client = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}
