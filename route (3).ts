import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface GenerateRequest {
  industry: 'beauty' | 'fitness' | 'legal' | 'homeware' | 'custom'
  customIndustry?: string
  postCount?: number
  platform?: 'instagram' | 'facebook' | 'twitter' | 'linkedin'
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational'
  includeHashtags?: boolean
  includeCTA?: boolean
}

interface GeneratedPost {
  id: string
  content: string
  hashtags: string[]
  cta?: string
  estimatedEngagement: 'high' | 'medium' | 'low'
  bestTimeToPost: string
  imagePrompt?: string
}

const industryPresets = {
  beauty: {
    description: 'Beauty, skincare, cosmetics, and wellness',
    keywords: ['skincare', 'beauty', 'glow', 'self-care', 'makeup', 'wellness'],
    tone: 'inspirational and empowering',
    commonHashtags: ['#BeautyTips', '#SkincareRoutine', '#SelfCare', '#GlowingSkin', '#BeautyAddict'],
  },
  fitness: {
    description: 'Fitness, health, workouts, and nutrition',
    keywords: ['fitness', 'workout', 'health', 'nutrition', 'strength', 'wellness'],
    tone: 'motivational and energetic',
    commonHashtags: ['#FitnessMotivation', '#WorkoutRoutine', '#HealthyLiving', '#FitnessGoals', '#StayActive'],
  },
  legal: {
    description: 'Legal services, law firm, attorney services',
    keywords: ['legal', 'law', 'attorney', 'rights', 'justice', 'consultation'],
    tone: 'professional and trustworthy',
    commonHashtags: ['#LegalAdvice', '#KnowYourRights', '#LawFirm', '#LegalServices', '#JusticeMatters'],
  },
  homeware: {
    description: 'Home decor, furniture, interior design, and home improvement',
    keywords: ['home', 'decor', 'interior', 'design', 'furniture', 'cozy'],
    tone: 'warm and inviting',
    commonHashtags: ['#HomeDecor', '#InteriorDesign', '#HomeInspiration', '#CozyHome', '#DecorIdeas'],
  },
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

    const body: GenerateRequest = await req.json()
    const {
      industry,
      customIndustry,
      postCount = 7,
      platform = 'instagram',
      tone = 'professional',
      includeHashtags = true,
      includeCTA = true,
    } = body

    const supabase = await createSupabaseServerClient()

    // Check user's business and subscription tier
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

    // Check subscription status
    if (business.subscription_status !== 'active' && business.subscription_status !== 'trialing') {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      )
    }

    // Check usage limits based on tier
    const { data: usageData } = await supabase
      .from('api_usage')
      .select('posts_generated')
      .eq('business_id', business.id)
      .gte('created_at', new Date(new Date().setDate(1)).toISOString())
      .single()

    const currentUsage = usageData?.posts_generated || 0
    const tierLimits = {
      starter: 50,      // £30/month tier
      professional: 200 // £55/month tier
    }

    const limit = tierLimits[business.subscription_tier as keyof typeof tierLimits] || 0

    if (currentUsage + postCount > limit) {
      return NextResponse.json(
        { 
          error: 'Monthly post generation limit reached',
          usage: currentUsage,
          limit,
          tier: business.subscription_tier
        },
        { status: 429 }
      )
    }

    // Get industry information
    const industryInfo = industry === 'custom' && customIndustry
      ? {
          description: customIndustry,
          keywords: [],
          tone: tone,
          commonHashtags: [],
        }
      : industryPresets[industry]

    // Construct prompt for Claude
    const prompt = `You are an expert social media content creator. Generate ${postCount} engaging ${platform} posts for a ${industryInfo.description} business.

Requirements:
- Platform: ${platform}
- Tone: ${tone}
- Character limit: ${platform === 'twitter' ? '280' : 'no strict limit, but keep concise'}
- Each post should be unique and valuable
${includeHashtags ? `- Include 3-5 relevant hashtags` : '- Do not include hashtags'}
${includeCTA ? `- Include a clear call-to-action` : '- No call-to-action needed'}

Industry context:
- Keywords: ${industryInfo.keywords.join(', ')}
- Tone: ${industryInfo.tone}
${industryInfo.commonHashtags.length > 0 ? `- Popular hashtags: ${industryInfo.commonHashtags.join(', ')}` : ''}

For each post, provide:
1. The main content/caption
2. Suggested hashtags (if requested)
3. Call-to-action (if requested)
4. A brief image/visual prompt suggestion
5. Best time to post (morning/afternoon/evening)
6. Estimated engagement level (high/medium/low)

Generate posts that:
- Are authentic and relatable
- Provide value (educational, entertaining, or inspirational)
- Encourage engagement (questions, polls, storytelling)
- Follow current social media best practices
- Are varied in content type (tips, behind-scenes, customer stories, promotions, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "posts": [
    {
      "content": "Post caption here...",
      "hashtags": ["hashtag1", "hashtag2"],
      "cta": "Call to action text",
      "imagePrompt": "Description of ideal image",
      "bestTimeToPost": "morning|afternoon|evening",
      "estimatedEngagement": "high|medium|low"
    }
  ]
}

Generate ${postCount} unique, high-quality posts now.`

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract and parse response
    const textContent = message.content.find(c => c.type === 'text')?.text || ''
    
    let cleanedText = textContent.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '').trim()
    }

    const response = JSON.parse(cleanedText)
    
    // Transform and validate posts
    const generatedPosts: GeneratedPost[] = response.posts.map((post: any, index: number) => ({
      id: `post_${Date.now()}_${index}`,
      content: post.content,
      hashtags: post.hashtags || [],
      cta: post.cta,
      estimatedEngagement: post.estimatedEngagement || 'medium',
      bestTimeToPost: post.bestTimeToPost || 'afternoon',
      imagePrompt: post.imagePrompt,
    }))

    // Save generated posts to database
    const postsToSave = generatedPosts.map(post => ({
      business_id: business.id,
      platform,
      content: post.content,
      hashtags: post.hashtags,
      cta: post.cta,
      image_prompt: post.imagePrompt,
      best_time_to_post: post.bestTimeToPost,
      estimated_engagement: post.estimatedEngagement,
      status: 'draft',
      generated_at: new Date().toISOString(),
    }))

    const { data: savedPosts, error: saveError } = await supabase
      .from('generated_posts')
      .insert(postsToSave)
      .select()

    if (saveError) {
      console.error('Error saving posts:', saveError)
    }

    // Update usage tracking
    await supabase
      .from('api_usage')
      .upsert({
        business_id: business.id,
        posts_generated: currentUsage + postCount,
        updated_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      posts: generatedPosts,
      savedPosts,
      usage: {
        current: currentUsage + postCount,
        limit,
        remaining: limit - (currentUsage + postCount),
      },
    })

  } catch (error) {
    console.error('Content generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve generated posts
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
    const status = searchParams.get('status') || 'all'
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
      .from('generated_posts')
      .select('*')
      .eq('business_id', business.id)
      .order('generated_at', { ascending: false })
      .limit(limit)

    if (status !== 'all') {
      query = query.eq('status', status)
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
    console.error('Fetch posts error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
