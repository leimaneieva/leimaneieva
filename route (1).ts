import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase'

interface IngestRequest {
  socialAccountId: string
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin'
  forceRefresh?: boolean
}

interface SocialMention {
  content: string
  author: string
  authorHandle?: string
  postUrl?: string
  postedAt: string
  engagementCount?: number
}

// Mock function to fetch data from Instagram/Facebook
// In production, replace with actual API calls
async function fetchInstagramMentions(
  accessToken: string,
  accountId: string
): Promise<SocialMention[]> {
  // This is a mock implementation
  // Real implementation would use Instagram Graph API:
  // GET https://graph.instagram.com/v18.0/{user-id}/media
  // GET https://graph.instagram.com/v18.0/{media-id}/comments
  
  try {
    // Mock data for development
    const mockMentions: SocialMention[] = [
      {
        content: "Love your recent post! The aesthetic is amazing 😍",
        author: "designlover_23",
        authorHandle: "@designlover_23",
        postUrl: "https://instagram.com/p/mock123",
        postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        engagementCount: 15
      },
      {
        content: "Great content as always! Keep it up 👏",
        author: "creative_minds",
        authorHandle: "@creative_minds",
        postUrl: "https://instagram.com/p/mock124",
        postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        engagementCount: 8
      },
      {
        content: "Not sure about this one... seems off brand",
        author: "critic_voice",
        authorHandle: "@critic_voice",
        postUrl: "https://instagram.com/p/mock125",
        postedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        engagementCount: 3
      }
    ]
    
    // In production, use real API:
    /*
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${accountId}/media?fields=id,caption,timestamp,comments_count,like_count&access_token=${accessToken}`
    )
    
    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }
    
    const data = await response.json()
    const mentions: SocialMention[] = []
    
    for (const post of data.data) {
      // Fetch comments for each post
      const commentsResponse = await fetch(
        `https://graph.instagram.com/v18.0/${post.id}/comments?fields=text,username,timestamp&access_token=${accessToken}`
      )
      
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        
        for (const comment of commentsData.data) {
          mentions.push({
            content: comment.text,
            author: comment.username,
            authorHandle: `@${comment.username}`,
            postUrl: `https://instagram.com/p/${post.id}`,
            postedAt: comment.timestamp,
            engagementCount: 0
          })
        }
      }
    }
    
    return mentions
    */
    
    return mockMentions
  } catch (error) {
    console.error('Error fetching Instagram mentions:', error)
    throw error
  }
}

async function fetchFacebookMentions(
  accessToken: string,
  accountId: string
): Promise<SocialMention[]> {
  // Mock implementation
  // Real implementation would use Facebook Graph API:
  // GET https://graph.facebook.com/v18.0/{page-id}/feed
  // GET https://graph.facebook.com/v18.0/{post-id}/comments
  
  const mockMentions: SocialMention[] = [
    {
      content: "This is exactly what I needed! Thank you for sharing 🙏",
      author: "Sarah Johnson",
      postUrl: "https://facebook.com/posts/mock456",
      postedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      engagementCount: 24
    },
    {
      content: "Interesting perspective, though I disagree with some points",
      author: "Mike Chen",
      postUrl: "https://facebook.com/posts/mock457",
      postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      engagementCount: 12
    }
  ]
  
  return mockMentions
}

async function fetchTwitterMentions(
  accessToken: string,
  accountId: string
): Promise<SocialMention[]> {
  // Mock implementation
  // Real implementation would use Twitter API v2:
  // GET https://api.twitter.com/2/users/{id}/mentions
  
  const mockMentions: SocialMention[] = [
    {
      content: "Just saw your latest tweet - absolutely brilliant! 🎯",
      author: "Tech Enthusiast",
      authorHandle: "@techenthusiast",
      postUrl: "https://twitter.com/user/status/mock789",
      postedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      engagementCount: 45
    }
  ]
  
  return mockMentions
}

async function fetchLinkedInMentions(
  accessToken: string,
  accountId: string
): Promise<SocialMention[]> {
  // Mock implementation
  // Real implementation would use LinkedIn API
  
  const mockMentions: SocialMention[] = [
    {
      content: "Great insights! This really resonates with my experience in the field.",
      author: "Jennifer Smith",
      postUrl: "https://linkedin.com/posts/mock321",
      postedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      engagementCount: 18
    }
  ]
  
  return mockMentions
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: IngestRequest = await req.json()
    const { socialAccountId, platform, forceRefresh = false } = body

    if (!socialAccountId || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: socialAccountId and platform' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Verify the social account belongs to the user
    const { data: socialAccount, error: accountError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('id', socialAccountId)
      .eq('user_id', user.id)
      .single()

    if (accountError || !socialAccount) {
      return NextResponse.json(
        { error: 'Social account not found or access denied' },
        { status: 404 }
      )
    }

    if (!socialAccount.is_active) {
      return NextResponse.json(
        { error: 'Social account is not active' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (socialAccount.token_expires_at) {
      const expiresAt = new Date(socialAccount.token_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Access token has expired. Please reconnect the account.' },
          { status: 401 }
        )
      }
    }

    // Fetch mentions based on platform
    let mentions: SocialMention[] = []
    
    try {
      switch (platform) {
        case 'instagram':
          mentions = await fetchInstagramMentions(
            socialAccount.access_token,
            socialAccount.account_id
          )
          break
        case 'facebook':
          mentions = await fetchFacebookMentions(
            socialAccount.access_token,
            socialAccount.account_id
          )
          break
        case 'twitter':
          mentions = await fetchTwitterMentions(
            socialAccount.access_token,
            socialAccount.account_id
          )
          break
        case 'linkedin':
          mentions = await fetchLinkedInMentions(
            socialAccount.access_token,
            socialAccount.account_id
          )
          break
        default:
          return NextResponse.json(
            { error: 'Unsupported platform' },
            { status: 400 }
          )
      }
    } catch (error) {
      console.error(`Error fetching ${platform} mentions:`, error)
      return NextResponse.json(
        { 
          error: `Failed to fetch mentions from ${platform}`,
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Insert mentions into database
    const insertedMentions = []
    const skippedMentions = []
    
    for (const mention of mentions) {
      // Check for duplicates (by content + author + posted_at)
      const { data: existing } = await supabase
        .from('mentions')
        .select('id')
        .eq('user_id', user.id)
        .eq('social_account_id', socialAccountId)
        .eq('content', mention.content)
        .eq('author', mention.author)
        .eq('posted_at', mention.postedAt)
        .single()

      if (existing && !forceRefresh) {
        skippedMentions.push(mention)
        continue
      }

      const { data: inserted, error: insertError } = await supabase
        .from('mentions')
        .insert({
          user_id: user.id,
          social_account_id: socialAccountId,
          platform,
          content: mention.content,
          author: mention.author,
          author_handle: mention.authorHandle || null,
          post_url: mention.postUrl || null,
          posted_at: mention.postedAt,
          engagement_count: mention.engagementCount || 0,
        })
        .select()
        .single()

      if (!insertError && inserted) {
        insertedMentions.push(inserted)
      }
    }

    // Trigger sentiment analysis for new mentions
    if (insertedMentions.length > 0) {
      // This could be done asynchronously in a queue/background job
      // For now, we'll return and let the client trigger analysis
      console.log(`Queued ${insertedMentions.length} mentions for sentiment analysis`)
    }

    return NextResponse.json({
      success: true,
      fetched: mentions.length,
      inserted: insertedMentions.length,
      skipped: skippedMentions.length,
      mentions: insertedMentions,
      message: insertedMentions.length > 0 
        ? `Successfully ingested ${insertedMentions.length} new mentions` 
        : 'No new mentions found'
    })

  } catch (error) {
    console.error('Ingestion error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to ingest social data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check last sync time
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const socialAccountId = searchParams.get('socialAccountId')

    if (!socialAccountId) {
      return NextResponse.json(
        { error: 'Missing socialAccountId parameter' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Get the most recent mention for this account
    const { data: lastMention } = await supabase
      .from('mentions')
      .select('created_at, posted_at')
      .eq('user_id', user.id)
      .eq('social_account_id', socialAccountId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      lastSync: lastMention?.created_at || null,
      lastMentionDate: lastMention?.posted_at || null
    })

  } catch (error) {
    console.error('Last sync check error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check last sync' },
      { status: 500 }
    )
  }
}
