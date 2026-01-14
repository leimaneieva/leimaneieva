import { Suspense } from 'react'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import AIContentGenerator from '@/components/AIContentGenerator'
import { Calendar, Sparkles, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

async function getSocialData(businessId: string) {
  const supabase = await createSupabaseServerClient()
  
  // Get generated posts
  const { data: generatedPosts } = await supabase
    .from('generated_posts')
    .select('*')
    .eq('business_id', businessId)
    .order('generated_at', { ascending: false })
    .limit(50)

  // Get scheduled posts
  const { data: scheduledPosts } = await supabase
    .from('scheduled_posts')
    .select('*, social_accounts!inner(platform, account_name)')
    .eq('business_id', businessId)
    .order('scheduled_time', { ascending: true })

  // Get connected accounts
  const { data: socialAccounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)

  return {
    generatedPosts: generatedPosts || [],
    scheduledPosts: scheduledPosts || [],
    socialAccounts: socialAccounts || [],
  }
}

export default async function SocialPage() {
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

  const data = await getSocialData(business.id)

  const scheduledCount = data.scheduledPosts.filter(p => p.status === 'scheduled').length
  const publishedCount = data.scheduledPosts.filter(p => p.status === 'published').length
  const draftCount = data.generatedPosts.filter(p => p.status === 'draft').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <header className="mb-12 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                Content Studio
              </h1>
              <p className="text-slate-600 text-lg">
                Generate, schedule, and manage your social media content
              </p>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Drafts
              </CardTitle>
              <Sparkles className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{draftCount}</div>
              <p className="text-xs text-slate-500 mt-1">Ready to schedule</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Scheduled
              </CardTitle>
              <Clock className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{scheduledCount}</div>
              <p className="text-xs text-slate-500 mt-1">Upcoming posts</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Published
              </CardTitle>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{publishedCount}</div>
              <p className="text-xs text-green-600 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Connected
              </CardTitle>
              <Calendar className="w-5 h-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{data.socialAccounts.length}</div>
              <p className="text-xs text-slate-500 mt-1">Social accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Content Generator */}
          <div className="lg:col-span-2">
            <AIContentGenerator business={business} />
          </div>

          {/* Sidebar - Scheduled Posts */}
          <div>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Posts
                </CardTitle>
                <CardDescription>
                  Next 7 days schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {data.scheduledPosts
                    .filter(p => p.status === 'scheduled')
                    .slice(0, 10)
                    .map((post) => (
                      <div
                        key={post.id}
                        className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              post.platform === 'instagram' ? 'bg-pink-500' :
                              post.platform === 'facebook' ? 'bg-blue-600' :
                              post.platform === 'twitter' ? 'bg-cyan-500' :
                              'bg-blue-700'
                            }`}></div>
                            <span className="text-xs font-medium text-slate-600 capitalize">
                              {post.platform}
                            </span>
                          </div>
                          <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-700 mb-3 line-clamp-2">
                          {post.content}
                        </p>
                        <div className="text-xs text-slate-500">
                          {new Date(post.scheduled_time).toLocaleString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                  
                  {data.scheduledPosts.filter(p => p.status === 'scheduled').length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No scheduled posts</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Generate content to get started
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Generated Posts Library */}
        <div className="mt-12">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">
                Content Library
              </CardTitle>
              <CardDescription>
                All your generated content in one place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All Posts</TabsTrigger>
                  <TabsTrigger value="draft">Drafts</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {data.generatedPosts.slice(0, 20).map((post) => (
                    <div
                      key={post.id}
                      className="p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            post.status === 'draft' ? 'bg-purple-100 text-purple-700' :
                            post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {post.status}
                          </span>
                          <span className="text-xs text-slate-500 capitalize">
                            {post.platform}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(post.generated_at).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      
                      <p className="text-slate-700 mb-3 leading-relaxed">
                        {post.content}
                      </p>
                      
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.hashtags.map((tag: string, i: number) => (
                            <span key={i} className="text-xs text-blue-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                          Edit
                        </button>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Schedule
                        </button>
                        <button className="text-sm text-slate-500 hover:text-slate-600 font-medium">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="draft">
                  {/* Filter for draft posts */}
                  <p className="text-slate-500 text-center py-12">Draft posts will appear here</p>
                </TabsContent>

                <TabsContent value="scheduled">
                  {/* Filter for scheduled posts */}
                  <p className="text-slate-500 text-center py-12">Scheduled posts will appear here</p>
                </TabsContent>

                <TabsContent value="published">
                  {/* Filter for published posts */}
                  <p className="text-slate-500 text-center py-12">Published posts will appear here</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
