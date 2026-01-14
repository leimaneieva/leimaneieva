'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AnalyticsData {
  id: string
  date: string
  positive_count: number
  negative_count: number
  neutral_count: number
  average_score: number
  total_mentions: number
}

interface Summary {
  totalMentions: number
  avgScore: number
  positiveCount: number
  negativeCount: number
  positivePercentage: number
}

interface Props {
  analytics: AnalyticsData[]
  summary: Summary
}

export default function SentimentHealthCard({ analytics, summary }: Props) {
  const [viewMode, setViewMode] = useState<'trend' | 'distribution'>('trend')

  // Calculate trend (comparing first half vs second half of period)
  const midPoint = Math.floor(analytics.length / 2)
  const firstHalfAvg = analytics.slice(0, midPoint).reduce((sum, d) => sum + d.average_score, 0) / midPoint
  const secondHalfAvg = analytics.slice(midPoint).reduce((sum, d) => sum + d.average_score, 0) / (analytics.length - midPoint)
  const trendDirection = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'stable'
  const trendPercent = Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)

  // Find max value for chart scaling
  const maxMentions = Math.max(...analytics.map(d => d.total_mentions), 1)

  // Get sentiment color
  const getSentimentColor = (score: number) => {
    if (score >= 7) return 'from-green-500 to-emerald-600'
    if (score >= 5) return 'from-yellow-500 to-amber-600'
    return 'from-red-500 to-rose-600'
  }

  const getSentimentTextColor = (score: number) => {
    if (score >= 7) return 'text-green-400'
    if (score >= 5) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Sentiment Health Score
          </h3>
          <div className="flex items-center gap-3">
            <span className={`text-5xl font-bold ${getSentimentTextColor(summary.avgScore)}`}>
              {summary.avgScore.toFixed(1)}
            </span>
            <div>
              <div className="flex items-center gap-1">
                {trendDirection === 'up' && (
                  <>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">
                      +{trendPercent.toFixed(1)}%
                    </span>
                  </>
                )}
                {trendDirection === 'down' && (
                  <>
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 text-sm font-medium">
                      -{trendPercent.toFixed(1)}%
                    </span>
                  </>
                )}
                {trendDirection === 'stable' && (
                  <>
                    <Minus className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-400 text-sm font-medium">
                      Stable
                    </span>
                  </>
                )}
              </div>
              <span className="text-slate-500 text-xs">vs previous period</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('trend')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'trend'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Trend
          </button>
          <button
            onClick={() => setViewMode('distribution')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'distribution'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Distribution
          </button>
        </div>
      </div>

      {/* Charts */}
      {viewMode === 'trend' ? (
        <div className="space-y-4">
          {/* Sentiment Score Line Chart */}
          <div className="h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 2.5, 5, 7.5, 10].map((value, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={200 - (value / 10) * 200}
                  x2="800"
                  y2={200 - (value / 10) * 200}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              ))}
              
              {/* Line path */}
              <path
                d={analytics.map((d, i) => {
                  const x = (i / (analytics.length - 1)) * 800
                  const y = 200 - (d.average_score / 10) * 200
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                }).join(' ')}
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Area fill */}
              <path
                d={`
                  ${analytics.map((d, i) => {
                    const x = (i / (analytics.length - 1)) * 800
                    const y = 200 - (d.average_score / 10) * 200
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                  }).join(' ')}
                  L 800 200 L 0 200 Z
                `}
                fill="url(#areaGradient)"
              />
              
              {/* Data points */}
              {analytics.map((d, i) => {
                const x = (i / (analytics.length - 1)) * 800
                const y = 200 - (d.average_score / 10) * 200
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="white"
                    className="transition-all duration-200 hover:r-6"
                  />
                )
              })}
              
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
                  <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-500 -ml-8">
              <span>10</span>
              <span>7.5</span>
              <span>5</span>
              <span>2.5</span>
              <span>0</span>
            </div>
          </div>

          {/* Volume bars */}
          <div className="h-24 flex items-end gap-1">
            {analytics.map((d, i) => {
              const height = (d.total_mentions / maxMentions) * 100
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-cyan-500/50 to-purple-500/50 rounded-t transition-all duration-200 hover:from-cyan-500 hover:to-purple-500 group relative"
                  style={{ height: `${height}%`, minHeight: '4px' }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {d.total_mentions} mentions
                    <div className="text-slate-400 text-xs">
                      {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sentiment distribution */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-white font-medium">Positive</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm">
                  {summary.positiveCount} ({summary.positivePercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${summary.positivePercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-white font-medium">Neutral</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm">
                  {summary.totalMentions - summary.positiveCount - summary.negativeCount} (
                  {(((summary.totalMentions - summary.positiveCount - summary.negativeCount) / summary.totalMentions) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-slate-500 to-slate-600 transition-all duration-500"
                style={{
                  width: `${((summary.totalMentions - summary.positiveCount - summary.negativeCount) / summary.totalMentions) * 100}%`
                }}
              ></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-white font-medium">Negative</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-sm">
                  {summary.negativeCount} ({((summary.negativeCount / summary.totalMentions) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-500"
                style={{ width: `${(summary.negativeCount / summary.totalMentions) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Daily breakdown */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h4 className="text-white font-semibold mb-4">Recent Activity</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {analytics.slice(-7).reverse().map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {new Date(d.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {d.total_mentions} mentions
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getSentimentTextColor(d.average_score)}`}>
                      {d.average_score.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
