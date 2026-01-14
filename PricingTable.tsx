'use client'

import { useState } from 'react'
import { Check, Sparkles, Zap, Crown, Loader2 } from 'lucide-react'

interface PricingTableProps {
  userId?: string
  currentTier?: 'starter' | 'professional' | null
}

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 30,
    currency: '£',
    period: 'month',
    description: 'Perfect for small businesses getting started',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    features: [
      '50 AI-generated posts per month',
      '30 scheduled posts',
      'Instagram & Facebook integration',
      'Basic analytics dashboard',
      'Email support',
      'Industry presets (4 options)',
    ],
    limits: {
      posts: 50,
      scheduled: 30,
      platforms: 2,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 55,
    currency: '£',
    period: 'month',
    description: 'For growing businesses with advanced needs',
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    popular: true,
    features: [
      '200 AI-generated posts per month',
      '100 scheduled posts',
      'All platforms (Instagram, Facebook, Twitter, LinkedIn)',
      'Advanced analytics & revenue tracking',
      'Priority support',
      'Custom industry presets',
      'A/B testing features',
      'Team collaboration (up to 3 users)',
    ],
    limits: {
      posts: 200,
      scheduled: 100,
      platforms: 4,
    },
  },
]

export default function PricingTable({ userId, currentTier }: PricingTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly')

  const handleCheckout = async (planId: string) => {
    if (!userId) {
      window.location.href = '/login?redirect=/pricing'
      return
    }

    setLoading(planId)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: planId === 'starter' 
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY 
            : process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Start automating your social media marketing with AI-powered content generation
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
                billingPeriod === 'annually'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annually
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const isCurrentPlan = currentTier === plan.id
            const finalPrice = billingPeriod === 'annually' 
              ? Math.round(plan.price * 12 * 0.8) 
              : plan.price

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-2xl scale-105'
                    : 'bg-white border-2 border-slate-200 shadow-xl hover:shadow-2xl hover:scale-105'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-3xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-600 mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-slate-900">
                      {plan.currency}{billingPeriod === 'annually' ? finalPrice : plan.price}
                    </span>
                    <span className="text-slate-600 text-lg">
                      /{billingPeriod === 'annually' ? 'year' : plan.period}
                    </span>
                  </div>
                  {billingPeriod === 'annually' && (
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      Save {plan.currency}{plan.price * 12 - finalPrice}/year
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading !== null || isCurrentPlan}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 mb-8 ${
                    isCurrentPlan
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    `Get Started with ${plan.name}`
                  )}
                </button>

                {/* Features List */}
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    What's Included:
                  </p>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-slate-700 leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Limits Badge */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {plan.limits.posts}
                      </p>
                      <p className="text-xs text-slate-500">Posts/month</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {plan.limits.scheduled}
                      </p>
                      <p className="text-xs text-slate-500">Scheduled</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {plan.limits.platforms}
                      </p>
                      <p className="text-xs text-slate-500">Platforms</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>14-day money-back guarantee</span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12 text-slate-900">
            Frequently Asked Questions
          </h3>
          <div className="space-y-6">
            <details className="bg-white rounded-xl p-6 shadow-lg">
              <summary className="font-bold text-slate-900 cursor-pointer">
                Can I switch plans later?
              </summary>
              <p className="text-slate-600 mt-3">
                Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </details>
            
            <details className="bg-white rounded-xl p-6 shadow-lg">
              <summary className="font-bold text-slate-900 cursor-pointer">
                What happens if I exceed my monthly limits?
              </summary>
              <p className="text-slate-600 mt-3">
                You'll receive a notification when you're approaching your limits. You can upgrade to a higher tier or wait until the next billing cycle.
              </p>
            </details>
            
            <details className="bg-white rounded-xl p-6 shadow-lg">
              <summary className="font-bold text-slate-900 cursor-pointer">
                Which industries do you support?
              </summary>
              <p className="text-slate-600 mt-3">
                We have specialized presets for beauty, fitness, legal, and homeware industries. Professional plan includes custom industry options.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
