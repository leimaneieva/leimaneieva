'use client'

import { useState } from 'react'
import { Instagram, Facebook, Twitter, Linkedin, Plus, Loader2 } from 'lucide-react'

interface SocialPlatform {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  gradient: string
  description: string
  comingSoon?: boolean
}

const platforms: SocialPlatform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    gradient: 'from-purple-500/10 to-pink-500/10',
    description: 'Track mentions, comments, and DMs'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    gradient: 'from-blue-500/10 to-blue-600/10',
    description: 'Monitor page comments and mentions'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: <Twitter className="w-6 h-6" />,
    color: 'from-cyan-500 to-blue-500',
    gradient: 'from-cyan-500/10 to-blue-500/10',
    description: 'Analyze tweets and replies',
    comingSoon: true
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Linkedin className="w-6 h-6" />,
    color: 'from-blue-700 to-blue-800',
    gradient: 'from-blue-700/10 to-blue-800/10',
    description: 'Track professional engagement',
    comingSoon: true
  }
]

export default function ConnectSocial() {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleConnect = async (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId)
    
    if (platform?.comingSoon) {
      alert('This platform is coming soon! Stay tuned.')
      return
    }

    setConnecting(platformId)

    try {
      // Initiate OAuth flow
      const response = await fetch('/api/auth/social/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId })
      })

      if (!response.ok) {
        throw new Error('Failed to initiate connection')
      }

      const { authUrl } = await response.json()
      
      // Redirect to OAuth provider
      window.location.href = authUrl
    } catch (error) {
      console.error(`Error connecting to ${platformId}:`, error)
      alert(`Failed to connect to ${platform?.name}. Please try again.`)
    } finally {
      setConnecting(null)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl text-white font-medium hover:from-purple-600 hover:to-cyan-600 transition-all duration-300 shadow-lg shadow-purple-500/25"
      >
        <Plus className="w-5 h-5" />
        Connect Social Account
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Connect Social Account
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Choose a platform to start tracking sentiment
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Platform Cards */}
            <div className="p-6 space-y-4">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handleConnect(platform.id)}
                  disabled={connecting !== null}
                  className={`w-full group relative overflow-hidden rounded-xl p-6 border border-white/10 transition-all duration-300 ${
                    platform.comingSoon 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${platform.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                      {connecting === platform.id ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        platform.icon
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">
                          {platform.name}
                        </h3>
                        {platform.comingSoon && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">
                        {platform.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    {!platform.comingSoon && (
                      <svg 
                        className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer Note */}
            <div className="border-t border-white/10 p-6">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-slate-400">
                  <p className="font-medium text-white mb-1">Secure OAuth Connection</p>
                  <p>
                    We use official OAuth flows and never store your passwords. 
                    You can revoke access anytime from your social media settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  )
}
