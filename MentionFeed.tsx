'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Minus, ExternalLink, Instagram, Facebook, Twitter, Linkedin, Sparkles } from 'lucide-react'

interface Mention {
  id: string
  content: string
  author: string
  author_handle: string | null
  post_url: string | null
  posted_at: string
  sentiment_score: number | null
  sentiment_label: 'positive' | 'negative' | 'neutral' | null
  sentiment_reasoning: string | null
  engagement_count: number | null
  social_accounts: {
    platform: string
    account_name: string
  }
}

interface Props {
  mentions: Mention[]
}

export default function MentionFeed({ mentions }: Props) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral' | 'unanalyzed'>('all')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const filteredMentions = mentions.filter(mention => {
    if (filter === 'all') return true
    if (filter === 'unanalyzed') return mention.sentiment_score === null
    return mention.sentiment_label === filter
  })

  const unanalyzedCount = mentions.filter(m => m.sentiment_score === null).length

  const getSentimentColor = (label: string | null) => {
    switch (label) {
      case 'positive': return 'text-green-400 bg-green-500/10'
      case 'negative': return 'text-red-400 bg-red-500/10'
      case 'neutral': return 'text-slate-400 bg-slate-500/10'
      default: return 'text-slate-500 bg-slate-500/10'
    }
  }

  const getSentimentIcon = (label: string | null) => {
    switch (label) {
      case 'positive': return <ThumbsUp className="w-4 h-4" />
      case 'negative': return <ThumbsDown className="w-4 h-4" />
      case 'neutral': return <Minus className="w-4 h-4" />
      default: return null
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-4 h-4" />
      case 'facebook': return <Facebook className="w-4 h-4" />
      case 'twitter': return <Twitter className="w-4 h-4" />
      case 'linkedin': return <Linkedin className="w-4 h-4" />
      default: return null
    }
  }

  const handleAnalyzeAll = async () => {
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 10 })
      })
      
      if (response.ok) {
        // Refresh the page to show updated results
        window.location.reload()
      }
    } catch (error) {
      console.error('Error analyzing mentions:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const posted = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - posted.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Recent Mentions</h3>
        
        {unanalyzedCount > 0 && (
          <button
            onClick={handleAnalyzeAll}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg text-white font-medium hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {isAnalyzing ? 'Analyzing...' : `Analyze ${unanalyzedCount}`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            filter === 'all'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          All ({mentions.length})
        </button>
        <button
          onClick={() => setFilter('positive')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            filter === 'positive'
              ? 'bg-green-500/20 text-green-400'
              : 'text-slate-400 hover:text-green-400 hover:bg-green-500/10'
          }`}
        >
          Positive ({mentions.filter(m => m.sentiment_label === 'positive').length})
        </button>
        <button
          onClick={() => setFilter('neutral')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            filter === 'neutral'
              ? 'bg-slate-500/20 text-slate-400'
              : 'text-slate-400 hover:bg-slate-500/10'
          }`}
        >
          Neutral ({mentions.filter(m => m.sentiment_label === 'neutral').length})
        </button>
        <button
          onClick={() => setFilter('negative')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            filter === 'negative'
              ? 'bg-red-500/20 text-red-400'
              : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
          }`}
        >
          Negative ({mentions.filter(m => m.sentiment_label === 'negative').length})
        </button>
        {unanalyzedCount > 0 && (
          <button
            onClick={() => setFilter('unanalyzed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === 'unanalyzed'
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-slate-400 hover:text-purple-400 hover:bg-purple-500/10'
            }`}
          >
            Unanalyzed ({unanalyzedCount})
          </button>
        )}
      </div>

      {/* Mentions List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {filteredMentions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No mentions found</p>
            <p className="text-slate-500 text-sm mt-2">
              {filter === 'all' 
                ? 'Connect social accounts to start tracking mentions' 
                : `No ${filter} mentions yet`}
            </p>
          </div>
        ) : (
          filteredMentions.map((mention) => (
            <div
              key={mention.id}
              className="group bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {mention.author[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">
                        {mention.author}
                      </p>
                      <div className="flex items-center gap-1 text-slate-400">
                        {getPlatformIcon(mention.social_accounts.platform)}
                        <span className="text-xs capitalize">
                          {mention.social_accounts.platform}
                        </span>
                      </div>
                    </div>
                    {mention.author_handle && (
                      <p className="text-slate-500 text-sm">
                        {mention.author_handle}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs whitespace-nowrap">
                    {getTimeAgo(mention.posted_at)}
                  </span>
                  {mention.post_url && (
                    <a
                      href={mention.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Content */}
              <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                {mention.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {mention.sentiment_score !== null ? (
                    <>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${getSentimentColor(mention.sentiment_label)}`}>
                        {getSentimentIcon(mention.sentiment_label)}
                        <span className="text-sm font-medium capitalize">
                          {mention.sentiment_label}
                        </span>
                      </div>
                      <div className="text-slate-400 text-sm">
                        Score: <span className={getSentimentColor(mention.sentiment_label).split(' ')[0]}>
                          {mention.sentiment_score.toFixed(1)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-500">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Pending Analysis
                      </span>
                    </div>
                  )}
                </div>
                
                {mention.engagement_count !== null && mention.engagement_count > 0 && (
                  <div className="text-slate-500 text-xs">
                    {mention.engagement_count} interactions
                  </div>
                )}
              </div>

              {/* Reasoning (collapsible) */}
              {mention.sentiment_reasoning && (
                <details className="mt-3 pt-3 border-t border-white/5">
                  <summary className="text-slate-400 text-xs cursor-pointer hover:text-white transition-colors">
                    View AI reasoning
                  </summary>
                  <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                    {mention.sentiment_reasoning}
                  </p>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
