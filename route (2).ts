import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase'

interface ScheduleRequest {
  postId?: string
  content?: string
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin'
  scheduledTime: string
  hashtags?: string[]
  imageUrl?: string
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

    const body: ScheduleRequest = await req.json()
    const { postId, content, platform, scheduledTime, hashtags, imageUrl } = body

    if (!content && !postId) {
      return NextResponse.json(
        { error: 'Either postId or content is required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Get business
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json(
        { error: 'No business profile found' },
        { status: 404 }
      )
    }

    // Verify subscription
    if (business.subscription_status !== 'active' && business.subscription_status !== 'trialing') {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      )
    }

    // Check if scheduling for connected platform
    const { data: socialAccount } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('business_id', business.id)
      .eq('platform', platform)
      .eq('is_active', true)
      .single()

    if (!socialAccount) {
      return NextResponse.json(
        { 
          error: `No active ${platform} account connected`,
          message: 'Please connect your social media account first'
        },
        { status: 400 }
      )
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledTime)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    // If postId provided, get the post content
    let postContent = content
    let postHashtags = hashtags || []

    if (postId) {
      const { data: generatedPost } = await supabase
        .from('generated_posts')
        .select('*')
        .eq('id', postId)
        .eq('business_id', business.id)
        .single()

      if (!generatedPost) {
        return NextResponse.json(
          { error: 'Generated post not found' },
          { status: 404 }
        )
      }

      postContent = generatedPost.content
      postHashtags = generatedPost.hashtags || []
    }

    // Check scheduling limits based on tier
    const { data: scheduledPosts } = await supabase
      .from('scheduled_posts')
      .select('id', { count: 'exact' })
      .eq('business_id', business.id)
      .eq('status', 'scheduled')

    const scheduledCount = scheduledPosts?.length || 0
    const tierLimits = {
      starter: 30,      // £30/month tier - 30 scheduled posts
      professional: 100  // £55/month tier - 100 scheduled posts
    }

    const limit = tierLimits[business.subscription_tier as keyof typeof tierLimits] || 0

    if (scheduledCount >= limit) {
      return NextResponse.json(
        { 
          error: 'Scheduling limit reached',
          scheduled: scheduledCount,
          limit,
          tier: business.subscription_tier
        },
        { status: 429 }
      )
    }

    // Create scheduled post
    const { data: scheduledPost, error: scheduleError } = await supabase
      .from('scheduled_posts')
      .insert({
        business_id: business.id,
        social_account_id: socialAccount.id,
        platform,
        content: postContent,
        hashtags: postHashtags,
        image_url: imageUrl,
        scheduled_time: scheduledDate.toISOString(),
        status: 'scheduled',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (scheduleError) {
      throw scheduleError
    }

    // Update generated post status if applicable
    if (postId) {
      await supabase
        .from('generated_posts')
        .update({ 
          status: 'scheduled',
          scheduled_post_id: scheduledPost.id
        })
        .eq('id', postId)
    }

    return NextResponse.json({
      success: true,
      scheduledPost,
      message: `Post scheduled for ${platform} on ${scheduledDate.toLocaleString()}`,
    })

  } catch (error) {
    console.error('Scheduling error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to schedule post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve scheduled posts
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
    const status = searchParams.get('status') || 'scheduled'
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = await createSupabaseServerClient()

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json(
        { error: 'No business profile found' },
        { status: 404 }
      )
    }

    let query = supabase
      .from('scheduled_posts')
      .select('*, social_accounts!inner(platform, account_name)')
      .eq('business_id', business.id)
      .order('scheduled_time', { ascending: true })
      .limit(limit)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: posts, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      posts,
      count: posts?.length || 0,
    })

  } catch (error) {
    console.error('Fetch scheduled posts error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    )
  }
}

// PATCH endpoint to update scheduled post
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { scheduledTime, content, hashtags, imageUrl } = body

    const supabase = await createSupabaseServerClient()

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json(
        { error: 'No business profile found' },
        { status: 404 }
      )
    }

    // Verify post belongs to user
    const { data: existingPost } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .eq('business_id', business.id)
      .single()

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Scheduled post not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (scheduledTime) updateData.scheduled_time = new Date(scheduledTime).toISOString()
    if (content) updateData.content = content
    if (hashtags) updateData.hashtags = hashtags
    if (imageUrl !== undefined) updateData.image_url = imageUrl

    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('scheduled_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Scheduled post updated successfully',
    })

  } catch (error) {
    console.error('Update scheduled post error:', error)
    
    return NextResponse.json(
      { error: 'Failed to update scheduled post' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to cancel scheduled post
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServerClient()

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json(
        { error: 'No business profile found' },
        { status: 404 }
      )
    }

    // Update status to cancelled instead of deleting
    const { error: cancelError } = await supabase
      .from('scheduled_posts')
      .update({ status: 'cancelled' })
      .eq('id', postId)
      .eq('business_id', business.id)

    if (cancelError) {
      throw cancelError
    }

    return NextResponse.json({
      success: true,
      message: 'Scheduled post cancelled successfully',
    })

  } catch (error) {
    console.error('Cancel scheduled post error:', error)
    
    return NextResponse.json(
      { error: 'Failed to cancel scheduled post' },
      { status: 500 }
    )
  }
}
