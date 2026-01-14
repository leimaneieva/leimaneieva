import { Suspense } from 'react'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import SentimentHealthCard from '@/components/SentimentHealthCard'
import MentionFeed from '@/components/MentionFeed'
import ConnectSocial from '@/components/ConnectSocial'
import { BarChart3, TrendingUp, MessageSquare, Users } from 'lucide-react'

async function getSentimentData(userId: string) {
  const supabase = await createSupabaseServerClient()
  
  // Get last 30 days of analytics
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: analytics, error: analyticsError } = await supabase
    .from('sentiment_analytics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true })
  
  // Get recent mentions
  const { data: mentions, error: mentionsError } = await supabase
    .from('mentions')
    .select('*, social_accounts!inner(platform, account_name)')
    .eq('user_id', userId)
    .order('posted_at', { ascending: false })
    .limit(50)
  
  // Get connected social accounts
  const { data: socialAccounts, error: accountsError } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
  
  // Calculate summary stats
  const totalMentions = analytics?.reduce((sum, day) => sum + day.total_mentions, 0) || 0
  const avgScore = analytics?.length 
    ? analytics.reduce((sum, day) => sum + day.average_score, 0) / analytics.length 
    : 0
  const positiveCount = analytics?.reduce((sum, day) => sum + day.positive_count, 0) || 0
  const negativeCount = analytics?.reduce((sum, day) => sum + day.negative_count, 0) || 0
  
  return {
    analytics: analytics || [],
    mentions: mentions || [],
    socialAccounts: socialAccounts || [],
    summary: {
      totalMentions,
      avgScore,
      positiveCount,
      negativeCount,
      positivePercentage: totalMentions > 0 ? (positiveCount / totalMentions) * 100 : 0
    }
  }
}

export default async function SentimentPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const data = await getSentimentData(user.id)
  const hasConnectedAccounts = data.socialAccounts.length > 0
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated background effect */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <header className="mb-12 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Sentiment Intelligence
              </h1>
              <p className="text-slate-400 text-lg">
                Real-time social analytics powered by Claude AI
              </p>
            </div>
            
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 text-white font-medium">
                Export Report
              </button>
            </div>
          </div>
        </header>

        {!hasConnectedAccounts ? (
          // Empty state - no connected accounts
          <div className="flex items-center justify-center py-24 animate-fade-in">
            <div className="text-center max-w-2xl">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/50">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Connect Your First Social Account
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Start analyzing sentiment across your social media presence. Connect Instagram, Facebook, or other platforms to get started.
              </p>
              <ConnectSocial />
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in animation-delay-200">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm font-medium">Total Mentions</span>
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {data.summary.totalMentions.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">Last 30 days</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm font-medium">Avg Sentiment</span>
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {data.summary.avgScore.toFixed(1)}
                </p>
                <p className="text-xs text-slate-500">Out of 10</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm font-medium">Positive Rate</span>
                  <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {data.summary.positivePercentage.toFixed(0)}%
                </p>
                <p className="text-xs text-slate-500">{data.summary.positiveCount} positive</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-sm font-medium">Connected</span>
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {data.socialAccounts.length}
                </p>
                <p className="text-xs text-slate-500">Social accounts</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in animation-delay-400">
              {/* Sentiment Health Card - 2 columns */}
              <div className="lg:col-span-2">
                <SentimentHealthCard 
                  analytics={data.analytics} 
                  summary={data.summary}
                />
              </div>
              
              {/* Connect Social - 1 column */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 h-full">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Connected Accounts
                  </h3>
                  <div className="space-y-4 mb-6">
                    {data.socialAccounts.map((account) => (
                      <div 
                        key={account.id}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {account.platform[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">
                            {account.account_name}
                          </p>
                          <p className="text-slate-500 text-xs capitalize">
                            {account.platform}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                  <ConnectSocial />
                </div>
              </div>
            </div>

            {/* Mention Feed */}
            <div className="mt-6 animate-fade-in animation-delay-600">
              <MentionFeed mentions={data.mentions} />
            </div>
          </>
        )}
      </div>
      
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
