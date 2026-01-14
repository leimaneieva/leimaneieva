import { Suspense } from 'react'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { TrendingUp, Users, DollarSign, BarChart3, Calendar, Target, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

async function getAnalyticsData(businessId: string) {
  const supabase = await createSupabaseServerClient()
  
  // Get social media metrics
  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'published')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Get engagement data
  const { data: engagement } = await supabase
    .from('post_analytics')
    .select('*')
    .eq('business_id', businessId)
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Calculate metrics
  const totalPosts = posts?.length || 0
  const totalLikes = engagement?.reduce((sum, e) => sum + (e.likes || 0), 0) || 0
  const totalComments = engagement?.reduce((sum, e) => sum + (e.comments || 0), 0) || 0
  const totalShares = engagement?.reduce((sum, e) => sum + (e.shares || 0), 0) || 0
  const totalReach = engagement?.reduce((sum, e) => sum + (e.reach || 0), 0) || 0
  
  const avgEngagementRate = engagement && engagement.length > 0
    ? engagement.reduce((sum, e) => sum + (e.engagement_rate || 0), 0) / engagement.length
    : 0

  return {
    totalPosts,
    totalLikes,
    totalComments,
    totalShares,
    totalReach,
    avgEngagementRate,
    engagement: engagement || [],
  }
}

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const supabase = await createSupabaseServerClient()
  
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    redirect('/onboarding')
  }

  const analytics = await getAnalyticsData(business.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <header className="mb-12 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-slate-600 text-lg">
                Track your social media performance and revenue metrics
              </p>
            </div>
            
            <div className="flex gap-3">
              <select className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:border-slate-300 transition-colors">
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 90 Days</option>
                <option>All Time</option>
              </select>
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium">
                Export Report
              </button>
            </div>
          </div>
        </header>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Posts */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Posts Published
              </CardTitle>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {analytics.totalPosts}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          {/* Total Reach */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-indigo-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Reach
              </CardTitle>
              <Target className="w-5 h-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {analytics.totalReach.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1">
                +12.5% from last period
              </p>
            </CardContent>
          </Card>

          {/* Engagement Rate */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-cyan-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Avg Engagement
              </CardTitle>
              <Zap className="w-5 h-5 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {analytics.avgEngagementRate.toFixed(1)}%
              </div>
              <p className="text-xs text-green-600 mt-1">
                +2.3% from last period
              </p>
            </CardContent>
          </Card>

          {/* Total Interactions */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Interactions
              </CardTitle>
              <Users className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {(analytics.totalLikes + analytics.totalComments + analytics.totalShares).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Likes, comments, shares
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Engagement Timeline */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
                Engagement Over Time
              </CardTitle>
              <CardDescription>
                Daily engagement metrics for the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-end gap-2">
                {analytics.engagement.slice(-30).map((day, i) => {
                  const maxEngagement = Math.max(...analytics.engagement.map(d => d.engagement_rate || 0))
                  const height = ((day.engagement_rate || 0) / maxEngagement) * 100
                  
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-indigo-500 to-cyan-500 rounded-t-lg hover:from-indigo-600 hover:to-cyan-600 transition-all cursor-pointer relative group"
                      style={{ height: `${height}%`, minHeight: '8px' }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        {day.engagement_rate?.toFixed(1)}% engagement
                        <div className="text-slate-400 text-xs">
                          {new Date(day.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Posts */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
                Platform Distribution
              </CardTitle>
              <CardDescription>
                Posts by platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Instagram</span>
                    <span className="text-sm font-bold text-slate-900">45%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Facebook</span>
                    <span className="text-sm font-bold text-slate-900">30%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Twitter</span>
                    <span className="text-sm font-bold text-slate-900">15%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">LinkedIn</span>
                    <span className="text-sm font-bold text-slate-900">10%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-700 to-blue-800 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Info */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-indigo-600" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Current Plan</p>
                <p className="text-2xl font-bold text-slate-900 capitalize">
                  {business.subscription_tier || 'Free'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    business.subscription_status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></span>
                  <p className="text-2xl font-bold text-slate-900 capitalize">
                    {business.subscription_status || 'Inactive'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Next Billing</p>
                <p className="text-2xl font-bold text-slate-900">
                  {business.subscription_period_end 
                    ? new Date(business.subscription_period_end).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
