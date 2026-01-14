import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!

interface AnalyzeRequest {
  mentionIds?: string[]
  content?: string
  batchSize?: number
}

interface SentimentResult {
  score: number
  label: 'positive' | 'negative' | 'neutral'
  reasoning: string
  confidence: number
}

async function analyzeSentimentWithClaude(content: string): Promise<SentimentResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze the sentiment of this social media mention and provide a detailed assessment.

Social Media Content:
"""
${content}
"""

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no other text):
{
  "score": <number between 0-10, where 0 is very negative, 5 is neutral, 10 is very positive>,
  "label": "<positive|negative|neutral>",
  "reasoning": "<brief explanation of why you chose this sentiment>",
  "confidence": <number between 0-1 indicating how confident you are>
}

Consider:
- Emotional tone and word choice
- Context and subtext
- Sarcasm or irony
- Emoji usage and meaning
- Overall intent of the message

Respond with ONLY the JSON object, no markdown formatting or additional text.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const textContent = data.content.find((c: any) => c.type === 'text')?.text || ''
    
    // Clean up the response - remove markdown code blocks if present
    let cleanedText = textContent.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '').trim()
    }
    
    const result = JSON.parse(cleanedText) as SentimentResult

    // Validate the result
    if (
      typeof result.score !== 'number' ||
      !['positive', 'negative', 'neutral'].includes(result.label) ||
      typeof result.reasoning !== 'string'
    ) {
      throw new Error('Invalid sentiment analysis result from Claude')
    }

    return result
  } catch (error) {
    console.error('Error calling Claude API:', error)
    throw error
  }
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

    const body: AnalyzeRequest = await req.json()
    const supabase = await createSupabaseServerClient()

    // Case 1: Analyze specific mention IDs
    if (body.mentionIds && body.mentionIds.length > 0) {
      const results = []
      
      for (const mentionId of body.mentionIds) {
        // Fetch the mention
        const { data: mention, error: fetchError } = await supabase
          .from('mentions')
          .select('*')
          .eq('id', mentionId)
          .eq('user_id', user.id) // RLS enforcement
          .single()

        if (fetchError || !mention) {
          results.push({
            mentionId,
            success: false,
            error: 'Mention not found or access denied'
          })
          continue
        }

        // Skip if already analyzed
        if (mention.sentiment_score !== null) {
          results.push({
            mentionId,
            success: true,
            cached: true,
            sentiment: {
              score: mention.sentiment_score,
              label: mention.sentiment_label,
              reasoning: mention.sentiment_reasoning
            }
          })
          continue
        }

        try {
          // Analyze with Claude
          const sentiment = await analyzeSentimentWithClaude(mention.content)

          // Update the mention
          const { error: updateError } = await supabase
            .from('mentions')
            .update({
              sentiment_score: sentiment.score,
              sentiment_label: sentiment.label,
              sentiment_reasoning: sentiment.reasoning,
            })
            .eq('id', mentionId)
            .eq('user_id', user.id)

          if (updateError) {
            throw updateError
          }

          results.push({
            mentionId,
            success: true,
            cached: false,
            sentiment
          })
        } catch (error) {
          results.push({
            mentionId,
            success: false,
            error: error instanceof Error ? error.message : 'Analysis failed'
          })
        }

        // Rate limiting: small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      return NextResponse.json({
        success: true,
        results,
        analyzed: results.filter(r => r.success && !r.cached).length,
        cached: results.filter(r => r.success && r.cached).length,
        failed: results.filter(r => !r.success).length,
      })
    }

    // Case 2: Analyze single content string (for testing)
    if (body.content) {
      const sentiment = await analyzeSentimentWithClaude(body.content)
      
      return NextResponse.json({
        success: true,
        sentiment
      })
    }

    // Case 3: Batch analyze unanalyzed mentions
    const batchSize = body.batchSize || 10
    
    const { data: unanalyzedMentions, error: fetchError } = await supabase
      .from('mentions')
      .select('id, content')
      .eq('user_id', user.id)
      .is('sentiment_score', null)
      .limit(batchSize)

    if (fetchError) {
      throw fetchError
    }

    if (!unanalyzedMentions || unanalyzedMentions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unanalyzed mentions found',
        analyzed: 0
      })
    }

    const results = []
    
    for (const mention of unanalyzedMentions) {
      try {
        const sentiment = await analyzeSentimentWithClaude(mention.content)

        const { error: updateError } = await supabase
          .from('mentions')
          .update({
            sentiment_score: sentiment.score,
            sentiment_label: sentiment.label,
            sentiment_reasoning: sentiment.reasoning,
          })
          .eq('id', mention.id)
          .eq('user_id', user.id)

        if (updateError) {
          throw updateError
        }

        results.push({
          mentionId: mention.id,
          success: true,
          sentiment
        })
      } catch (error) {
        results.push({
          mentionId: mention.id,
          success: false,
          error: error instanceof Error ? error.message : 'Analysis failed'
        })
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      results,
      analyzed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      remaining: Math.max(0, unanalyzedMentions.length - results.filter(r => r.success).length)
    })

  } catch (error) {
    console.error('Sentiment analysis error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze sentiment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check analysis status
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createSupabaseServerClient()
    
    // Get counts
    const { data: total } = await supabase
      .from('mentions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    const { data: analyzed } = await supabase
      .from('mentions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('sentiment_score', 'is', null)
    
    const totalCount = total || 0
    const analyzedCount = analyzed || 0
    const pendingCount = totalCount - analyzedCount
    
    return NextResponse.json({
      success: true,
      stats: {
        total: totalCount,
        analyzed: analyzedCount,
        pending: pendingCount,
        percentageComplete: totalCount > 0 ? (analyzedCount / totalCount) * 100 : 0
      }
    })

  } catch (error) {
    console.error('Status check error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
