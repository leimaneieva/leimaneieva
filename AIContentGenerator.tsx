'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Instagram, Facebook, Twitter, Linkedin, Wand2, Check } from 'lucide-react'

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
    <div className="border-0 shadow-lg bg-white rounded-2xl p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="text-3xl font-bold text-slate-900 flex items-center gap-3 mb-3">
          <Wand2 className="w-8 h-8 text-purple-600" />
          AI Content Generator
        </div>
        <p className="text-slate-600 text-lg">
          Generate engaging social media posts powered by Claude AI
        </p>
      </div>

      <div className="space-y-8">
        {/* Industry Selection */}
        <div>
          <label className="block text-lg font-semibold text-slate-900 mb-6">
            Select Industry
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`p-6 rounded-2xl border-2 transition-all text-left hover:shadow-md ${
                  selectedIndustry === industry.id
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-slate-200 hover:border-slate-400 bg-white'
                }`}
              >
                <div className="flex items-start gap-4 mb-3">
                  <span className="text-3xl flex-shrink-0 mt-0.5">{industry.icon}</span>
                  <div>
                    <span className="font-bold text-xl text-slate-900 block">{industry.name}</span>
                    <p className="text-sm text-slate-600 mt-1">{industry.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-lg font-semibold text-slate-900 mb-6">
            Target Platform
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon
              const canAccess = canAccessPlatform(platform.id)
              
              return (
                <button
                  key={platform.id}
                  onClick={() => canAccess && setSelectedPlatform(platform.id)}
                  disabled={!canAccess}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center ${
                    selectedPlatform === platform.id
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : canAccess
                      ? 'border-slate-200 hover:border-slate-400 hover:shadow-md bg-white'
                      : 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Icon className={`w-10 h-10 mb-3 ${platform.color}`} />
                  <p className="text-sm font-semibold text-slate-900">{platform.name}</p>
                  {!canAccess && (
                    <p className="text-xs text-amber-600 mt-2 font-medium">Pro only</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="block text-lg font-semibold text-slate-900 mb-6">
            Content Tone
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tones.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setSelectedTone(tone.id)}
                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center hover:shadow-md ${
                  selectedTone === tone.id
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-slate-200 hover:border-slate-400 bg-white'
                }`}
              >
                <span className="text-3xl mb-2">{tone.emoji}</span>
                <p className="text-sm font-semibold text-slate-900">{tone.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Post Count */}
        <div className="bg-slate-50 p-6 rounded-2xl">
          <label className="block text-lg font-semibold text-slate-900 mb-4">
            Number of Posts: <span className="text-2xl text-purple-600 font-bold">{postCount}</span>
          </label>
          <input
            type="range"
            min="1"
            max="14"
            value={postCount}
            onChange={(e) => setPostCount(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
          <div className="flex justify-between text-sm text-slate-500 mt-2">
            <span>1 post</span>
            <span>14 posts</span>
          </div>
        </div>

        {/* Options */}
        <div className="bg-slate-50 p-6 rounded-2xl">
          <div className="space-y-4">
            <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-white transition-colors">
              <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                includeHashtags
                  ? 'bg-purple-600 border-purple-600 shadow-md'
                  : 'border-slate-300 group-hover:border-slate-400'
              }`}>
                {includeHashtags && <Check className="w-4 h-4 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={includeHashtags}
                onChange={(e) => setIncludeHashtags(e.target.checked)}
                className="sr-only"
              />
              <span className="text-base text-slate-800 font-medium">Include hashtags</span>
            </label>

            <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-white transition-colors">
              <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                includeCTA
                  ? 'bg-purple-600 border-purple-600 shadow-md'
                  : 'border-slate-300 group-hover:border-slate-400'
              }`}>
                {includeCTA && <Check className="w-4 h-4 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={includeCTA}
                onChange={(e) => setIncludeCTA(e.target.checked)}
                className="sr-only"
              />
              <span className="text-base text-slate-800 font-medium">Include call-to-action</span>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
            <p className="text-base text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || business.subscription_status !== 'active'}
          className="w-full py-6 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 text-white rounded-2xl font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Generating amazing content...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              Generate {postCount} Posts
            </>
          )}
        </button>

        {/* Generated Posts Preview */}
        {generatedPosts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900">
                Generated Posts ({generatedPosts.length})
              </h3>
              <button className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-all shadow-lg">
                Schedule All
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {generatedPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="p-6 bg-gradient-to-r from-slate-50 to-white rounded-2xl hover:shadow-xl transition-all border border-slate-100 hover:border-slate-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-sm font-semibold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
                      Post #{index + 1}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      post.estimatedEngagement === 'high' ? 'bg-emerald-100 text-emerald-800' :
                      post.estimatedEngagement === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {post.estimatedEngagement} engagement
                    </span>
                  </div>
                  <p className="text-base text-slate-800 mb-4 leading-relaxed font-medium">
                    {post.content}
                  </p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-all shadow-md hover:shadow-lg">
                      Schedule
                    </button>
                    <button className="px-4 py-2 text-slate-700 hover:text-slate-900 font-semibold hover:bg-slate-100 rounded-xl transition-all">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
