'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Instagram, Facebook, Twitter, Linkedin, Wand2, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Business {
  id: string
  subscription_tier: 'starter' | 'professional'
  subscription_status: string
}

interface AIContentGeneratorProps {
  business: Business
}

const industries = [
  {
    id: 'beauty',
    name: 'Beauty & Skincare',
    icon: '💄',
    description: 'Cosmetics, skincare, and wellness content',
    examples: ['Product launches', 'Skincare tips', 'Beauty tutorials'],
  },
  {
    id: 'fitness',
    name: 'Fitness & Health',
    icon: '💪',
    description: 'Workout routines, nutrition, and wellness',
    examples: ['Workout plans', 'Nutrition tips', 'Fitness motivation'],
  },
  {
    id: 'legal',
    name: 'Legal Services',
    icon: '⚖️',
    description: 'Law firms and attorney services',
    examples: ['Legal tips', 'Rights information', 'Case studies'],
  },
  {
    id: 'homeware',
    name: 'Homeware & Decor',
    icon: '🏠',
    description: 'Home decor, furniture, and interior design',
    examples: ['Decor ideas', 'Room makeovers', 'Style guides'],
  },
]

const platforms = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'text-cyan-600' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
]

const tones = [
  { id: 'professional', name: 'Professional', emoji: '👔' },
  { id: 'casual', name: 'Casual', emoji: '😊' },
  { id: 'inspirational', name: 'Inspirational', emoji: '✨' },
  { id: 'educational', name: 'Educational', emoji: '📚' },
]

export default function AIContentGenerator({ business }: AIContentGeneratorProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('beauty')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram')
  const [selectedTone, setSelectedTone] = useState<string>('professional')
  const [postCount, setPostCount] = useState<number>(7)
  const [includeHashtags, setIncludeHashtags] = useState<boolean>(true)
  const [includeCTA, setIncludeCTA] = useState<boolean>(true)
  const [customIndustry, setCustomIndustry] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setGeneratedPosts([])

    try {
      const response = await fetch('/api/social/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry: selectedIndustry,
          customIndustry: selectedIndustry === 'custom' ? customIndustry : undefined,
          postCount,
          platform: selectedPlatform,
          tone: selectedTone,
          includeHashtags,
          includeCTA,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content')
      }

      setGeneratedPosts(data.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const canAccessPlatform = (platformId: string) => {
    if (business.subscription_tier === 'professional') return true
    return ['instagram', 'facebook'].includes(platformId)
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-purple-600" />
          AI Content Generator
        </CardTitle>
        <CardDescription>
          Generate engaging social media posts powered by Claude AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Industry Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            Select Industry
          </label>
          <div className="grid grid-cols-2 gap-3">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedIndustry === industry.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{industry.icon}</span>
                  <span className="font-bold text-slate-900">{industry.name}</span>
                </div>
                <p className="text-xs text-slate-600">{industry.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            Target Platform
          </label>
          <div className="grid grid-cols-4 gap-3">
            {platforms.map((platform) => {
              const Icon = platform.icon
              const canAccess = canAccessPlatform(platform.id)
              
              return (
                <button
                  key={platform.id}
                  onClick={() => canAccess && setSelectedPlatform(platform.id)}
                  disabled={!canAccess}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedPlatform === platform.id
                      ? 'border-purple-500 bg-purple-50'
                      : canAccess
                      ? 'border-slate-200 hover:border-slate-300 bg-white'
                      : 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${platform.color}`} />
                  <p className="text-xs font-medium text-slate-900">{platform.name}</p>
                  {!canAccess && (
                    <p className="text-2xs text-amber-600 mt-1">Pro only</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            Content Tone
          </label>
          <div className="grid grid-cols-4 gap-3">
            {tones.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setSelectedTone(tone.id)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedTone === tone.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="block text-2xl mb-1">{tone.emoji}</span>
                <p className="text-xs font-medium text-slate-900">{tone.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Post Count */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            Number of Posts: {postCount}
          </label>
          <input
            type="range"
            min="1"
            max="14"
            value={postCount}
            onChange={(e) => setPostCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>1 post</span>
            <span>14 posts</span>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
              includeHashtags
                ? 'bg-purple-600 border-purple-600'
                : 'border-slate-300 group-hover:border-slate-400'
            }`}>
              {includeHashtags && <Check className="w-3 h-3 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={includeHashtags}
              onChange={(e) => setIncludeHashtags(e.target.checked)}
              className="sr-only"
            />
            <span className="text-sm text-slate-700">Include hashtags</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
              includeCTA
                ? 'bg-purple-600 border-purple-600'
                : 'border-slate-300 group-hover:border-slate-400'
            }`}>
              {includeCTA && <Check className="w-3 h-3 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={includeCTA}
              onChange={(e) => setIncludeCTA(e.target.checked)}
              className="sr-only"
            />
            <span className="text-sm text-slate-700">Include call-to-action</span>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || business.subscription_status !== 'active'}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating amazing content...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate {postCount} Posts
            </>
          )}
        </button>

        {/* Generated Posts Preview */}
        {generatedPosts.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Generated Posts ({generatedPosts.length})
              </h3>
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Schedule All
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500">
                      Post #{index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded text-2xs font-medium ${
                      post.estimatedEngagement === 'high' ? 'bg-green-100 text-green-700' :
                      post.estimatedEngagement === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {post.estimatedEngagement} engagement
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2 leading-relaxed">
                    {post.content}
                  </p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {post.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="text-xs text-blue-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                      Schedule
                    </button>
                    <button className="text-xs text-slate-500 hover:text-slate-600 font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
