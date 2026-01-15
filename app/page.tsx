import { Suspense } from 'react'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { BarChart3, TrendingUp, MessageSquare, Users } from 'lucide-react'

export default async function Page() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-10 space-y-8 max-w-7xl p-4 sm:p-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Social Sentiment Dashboard
        </h1>
        <div className="flex items-center space-x-2 bg-green-100 px-4 py-2 rounded-full">
          <TrendingUp className="h-6 w-6 text-green-600" />
          <span className="text-2xl font-bold text-green-800">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-lg font-semibold text-slate-900">Total Mentions</h3>
            <Users className="h-5 w-5 text-slate-400 group-hover:text-slate-500 transition-colors" />
          </div>
          <div className="space-y-2">
            <div className="text-3xl lg:text-4xl font-bold text-slate-900">1,234</div>
            <p className="text-sm text-slate-500">+12 from yesterday</p>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-green-200/50 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-lg font-semibold text-slate-900">Positive</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl lg:text-4xl font-bold text-green-600">78%</div>
        </div>

        <div className="group bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-red-200/50 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-lg font-semibold text-slate-900">Negative</h3>
            <BarChart3 className="h-5 w-5 text-red-500" />
          </div>
          <div className="text-3xl lg:text-4xl font-bold text-red-500">12%</div>
        </div>

        <div className="group bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-lg font-semibold text-slate-900">Neutral</h3>
            <MessageSquare className="h-5 w-5 text-slate-400 group-hover:text-slate-500 transition-colors" />
          </div>
          <div className="text-3xl lg:text-4xl font-bold text-slate-900">10%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="border-b border-slate-200 pb-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Quick Actions
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">New</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="group relative p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-2xl"></div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <BarChart3 className="w-10 h-10 text-purple-600 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">Analyze New Mentions</h3>
                  <p className="text-sm text-slate-500">Get latest sentiment data</p>
                </div>
              </div>
            </button>

            <button className="group relative p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-2xl"></div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <Users className="w-10 h-10 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">Connect Instagram</h3>
                  <p className="text-sm text-slate-500">Link your account</p>
                </div>
              </div>
            </button>

            <button className="group relative p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-2xl"></div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                <TrendingUp className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">Export Report</h3>
                  <p className="text-sm text-slate-500">Download PDF/CSV</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
