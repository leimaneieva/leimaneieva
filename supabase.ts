import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Types for our database schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      social_accounts: {
        Row: {
          id: string
          user_id: string
          platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin'
          account_id: string
          account_name: string
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin'
          account_id: string
          account_name: string
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: 'instagram' | 'facebook' | 'twitter' | 'linkedin'
          account_id?: string
          account_name?: string
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      mentions: {
        Row: {
          id: string
          user_id: string
          social_account_id: string
          platform: string
          content: string
          author: string
          author_handle: string | null
          post_url: string | null
          posted_at: string
          sentiment_score: number | null
          sentiment_label: 'positive' | 'negative' | 'neutral' | null
          sentiment_reasoning: string | null
          engagement_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          social_account_id: string
          platform: string
          content: string
          author: string
          author_handle?: string | null
          post_url?: string | null
          posted_at: string
          sentiment_score?: number | null
          sentiment_label?: 'positive' | 'negative' | 'neutral' | null
          sentiment_reasoning?: string | null
          engagement_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          social_account_id?: string
          platform?: string
          content?: string
          author?: string
          author_handle?: string | null
          post_url?: string | null
          posted_at?: string
          sentiment_score?: number | null
          sentiment_label?: 'positive' | 'negative' | 'neutral' | null
          sentiment_reasoning?: string | null
          engagement_count?: number | null
          created_at?: string
        }
      }
      sentiment_analytics: {
        Row: {
          id: string
          user_id: string
          date: string
          positive_count: number
          negative_count: number
          neutral_count: number
          average_score: number
          total_mentions: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          positive_count?: number
          negative_count?: number
          neutral_count?: number
          average_score?: number
          total_mentions?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          positive_count?: number
          negative_count?: number
          neutral_count?: number
          average_score?: number
          total_mentions?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Client Component helper
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Server Component helper
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// Service role client for admin operations (backend only)
export const createSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper to get current user
export const getCurrentUser = async () => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

// Helper for RLS policy enforcement
export const enforceRLS = async (userId: string) => {
  const currentUser = await getCurrentUser()
  
  if (!currentUser || currentUser.id !== userId) {
    throw new Error('Unauthorized: User ID mismatch')
  }
  
  return currentUser
}
