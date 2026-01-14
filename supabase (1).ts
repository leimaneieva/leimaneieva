import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Database Types
export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          user_id: string
          business_name: string | null
          industry: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | null
          subscription_tier: 'starter' | 'professional' | null
          subscription_period_start: string | null
          subscription_period_end: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name?: string | null
          industry?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | null
          subscription_tier?: 'starter' | 'professional' | null
          subscription_period_start?: string | null
          subscription_period_end?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string | null
          industry?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | null
          subscription_tier?: 'starter' | 'professional' | null
          subscription_period_start?: string | null
          subscription_period_end?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      social_accounts: {
        Row: {
          id: string
          business_id: string
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
          business_id: string
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
          business_id?: string
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
      generated_posts: {
        Row: {
          id: string
          business_id: string
          platform: string
          content: string
          hashtags: string[] | null
          cta: string | null
          image_prompt: string | null
          best_time_to_post: string | null
          estimated_engagement: 'high' | 'medium' | 'low' | null
          status: 'draft' | 'scheduled' | 'published'
          scheduled_post_id: string | null
          generated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          platform: string
          content: string
          hashtags?: string[] | null
          cta?: string | null
          image_prompt?: string | null
          best_time_to_post?: string | null
          estimated_engagement?: 'high' | 'medium' | 'low' | null
          status?: 'draft' | 'scheduled' | 'published'
          scheduled_post_id?: string | null
          generated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          platform?: string
          content?: string
          hashtags?: string[] | null
          cta?: string | null
          image_prompt?: string | null
          best_time_to_post?: string | null
          estimated_engagement?: 'high' | 'medium' | 'low' | null
          status?: 'draft' | 'scheduled' | 'published'
          scheduled_post_id?: string | null
          generated_at?: string
        }
      }
      scheduled_posts: {
        Row: {
          id: string
          business_id: string
          social_account_id: string
          platform: string
          content: string
          hashtags: string[] | null
          image_url: string | null
          scheduled_time: string
          status: 'scheduled' | 'published' | 'failed' | 'cancelled'
          published_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          social_account_id: string
          platform: string
          content: string
          hashtags?: string[] | null
          image_url?: string | null
          scheduled_time: string
          status?: 'scheduled' | 'published' | 'failed' | 'cancelled'
          published_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          social_account_id?: string
          platform?: string
          content?: string
          hashtags?: string[] | null
          image_url?: string | null
          scheduled_time?: string
          status?: 'scheduled' | 'published' | 'failed' | 'cancelled'
          published_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      post_analytics: {
        Row: {
          id: string
          business_id: string
          scheduled_post_id: string
          date: string
          likes: number | null
          comments: number | null
          shares: number | null
          reach: number | null
          impressions: number | null
          engagement_rate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          scheduled_post_id: string
          date: string
          likes?: number | null
          comments?: number | null
          shares?: number | null
          reach?: number | null
          impressions?: number | null
          engagement_rate?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          scheduled_post_id?: string
          date?: string
          likes?: number | null
          comments?: number | null
          shares?: number | null
          reach?: number | null
          impressions?: number | null
          engagement_rate?: number | null
          created_at?: string
        }
      }
      api_usage: {
        Row: {
          id: string
          business_id: string
          posts_generated: number
          api_calls: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          posts_generated?: number
          api_calls?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          posts_generated?: number
          api_calls?: number
          created_at?: string
          updated_at?: string
        }
      }
      payment_history: {
        Row: {
          id: string
          stripe_customer_id: string
          stripe_invoice_id: string
          amount: number
          currency: string
          status: 'succeeded' | 'failed' | 'pending'
          paid_at: string
          created_at: string
        }
        Insert: {
          id?: string
          stripe_customer_id: string
          stripe_invoice_id: string
          amount: number
          currency: string
          status: 'succeeded' | 'failed' | 'pending'
          paid_at: string
          created_at?: string
        }
        Update: {
          id?: string
          stripe_customer_id?: string
          stripe_invoice_id?: string
          amount?: number
          currency?: string
          status?: 'succeeded' | 'failed' | 'pending'
          paid_at?: string
          created_at?: string
        }
      }
    }
  }
}

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
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

// Admin client with service role
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

// Get current authenticated user
export const getCurrentUser = async () => {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

// Get business for current user
export const getCurrentBusiness = async () => {
  const user = await getCurrentUser()
  if (!user) return null
  
  const supabase = await createSupabaseServerClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  return business
}

// Check if user has active subscription
export const hasActiveSubscription = async (tier?: 'starter' | 'professional') => {
  const business = await getCurrentBusiness()
  
  if (!business) return false
  
  const isActive = ['active', 'trialing'].includes(business.subscription_status || '')
  
  if (tier) {
    return isActive && business.subscription_tier === tier
  }
  
  return isActive
}

// RLS policy enforcement helper
export const enforceBusinessAccess = async (businessId: string) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  const supabase = await createSupabaseServerClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()
  
  if (!business) {
    throw new Error('Access denied to this business')
  }
  
  return business
}
