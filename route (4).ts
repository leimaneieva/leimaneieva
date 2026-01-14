import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

interface RevenueMetrics {
  currentMonthRevenue: number
  previousMonthRevenue: number
  growthRate: number
  totalCustomers: number
  activeSubscriptions: number
  churnedSubscriptions: number
  churnRate: number
  avgRevenuePerCustomer: number
  lifetimeValue: number
  mrr: number // Monthly Recurring Revenue
  arr: number // Annual Recurring Revenue
}

interface RevenueByTier {
  starter: number
  professional: number
}

interface RevenueData {
  metrics: RevenueMetrics
  revenueByTier: RevenueByTier
  recentPayments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    customer_email: string | null
    created: Date
  }>
  monthlyTrend: Array<{
    month: string
    revenue: number
    customers: number
  }>
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Verify user has admin access (you can customize this check)
    const { data: business } = await supabase
      .from('businesses')
      .select('subscription_tier, is_admin')
      .eq('user_id', user.id)
      .single()

    // Only allow professional tier or admins to access revenue data
    if (!business?.is_admin && business?.subscription_tier !== 'professional') {
      return NextResponse.json(
        { error: 'Access denied. Professional tier required.' },
        { status: 403 }
      )
    }

    // Get date ranges
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const last6MonthsStart = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    // Fetch all subscriptions
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'all',
    })

    // Calculate active subscriptions
    const activeSubscriptions = subscriptions.data.filter(
      sub => sub.status === 'active' || sub.status === 'trialing'
    )

    // Calculate churned subscriptions (cancelled this month)
    const churnedSubscriptions = subscriptions.data.filter(
      sub => sub.status === 'canceled' && 
      sub.canceled_at && 
      new Date(sub.canceled_at * 1000) >= currentMonthStart
    )

    // Fetch invoices for current and previous month
    const currentMonthInvoices = await stripe.invoices.list({
      created: {
        gte: Math.floor(currentMonthStart.getTime() / 1000),
      },
      status: 'paid',
      limit: 100,
    })

    const previousMonthInvoices = await stripe.invoices.list({
      created: {
        gte: Math.floor(previousMonthStart.getTime() / 1000),
        lt: Math.floor(previousMonthEnd.getTime() / 1000),
      },
      status: 'paid',
      limit: 100,
    })

    // Calculate current month revenue
    const currentMonthRevenue = currentMonthInvoices.data.reduce(
      (sum, invoice) => sum + (invoice.amount_paid / 100), 
      0
    )

    // Calculate previous month revenue
    const previousMonthRevenue = previousMonthInvoices.data.reduce(
      (sum, invoice) => sum + (invoice.amount_paid / 100), 
      0
    )

    // Calculate growth rate
    const growthRate = previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      const amount = sub.items.data[0]?.price?.unit_amount || 0
      return sum + (amount / 100)
    }, 0)

    // Calculate ARR (Annual Recurring Revenue)
    const arr = mrr * 12

    // Calculate revenue by tier
    let starterRevenue = 0
    let professionalRevenue = 0

    activeSubscriptions.forEach(sub => {
      const priceId = sub.items.data[0]?.price?.id
      const amount = (sub.items.data[0]?.price?.unit_amount || 0) / 100

      if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY) {
        professionalRevenue += amount
      } else {
        starterRevenue += amount
      }
    })

    // Calculate total customers
    const customers = await stripe.customers.list({ limit: 100 })
    const totalCustomers = customers.data.length

    // Calculate churn rate
    const churnRate = activeSubscriptions.length > 0
      ? (churnedSubscriptions.length / activeSubscriptions.length) * 100
      : 0

    // Calculate average revenue per customer
    const avgRevenuePerCustomer = totalCustomers > 0
      ? mrr / totalCustomers
      : 0

    // Estimate lifetime value (simplified: MRR / churn rate)
    const lifetimeValue = churnRate > 0
      ? (mrr / totalCustomers) / (churnRate / 100)
      : avgRevenuePerCustomer * 12

    // Get recent payments
    const recentInvoices = await stripe.invoices.list({
      limit: 10,
      status: 'paid',
    })

    const recentPayments = await Promise.all(
      recentInvoices.data.map(async (invoice) => {
        let customerEmail = null
        if (typeof invoice.customer === 'string') {
          const customer = await stripe.customers.retrieve(invoice.customer)
          if (!customer.deleted) {
            customerEmail = customer.email
          }
        }

        return {
          id: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status || 'unknown',
          customer_email: customerEmail,
          created: new Date(invoice.created * 1000),
        }
      })
    )

    // Calculate monthly trend for last 6 months
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthInvoices = await stripe.invoices.list({
        created: {
          gte: Math.floor(monthStart.getTime() / 1000),
          lt: Math.floor(monthEnd.getTime() / 1000),
        },
        status: 'paid',
        limit: 100,
      })

      const revenue = monthInvoices.data.reduce(
        (sum, inv) => sum + (inv.amount_paid / 100),
        0
      )

      // Get unique customers for that month
      const uniqueCustomers = new Set(
        monthInvoices.data.map(inv => inv.customer)
      ).size

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue,
        customers: uniqueCustomers,
      })
    }

    const responseData: RevenueData = {
      metrics: {
        currentMonthRevenue,
        previousMonthRevenue,
        growthRate,
        totalCustomers,
        activeSubscriptions: activeSubscriptions.length,
        churnedSubscriptions: churnedSubscriptions.length,
        churnRate,
        avgRevenuePerCustomer,
        lifetimeValue,
        mrr,
        arr,
      },
      revenueByTier: {
        starter: starterRevenue,
        professional: professionalRevenue,
      },
      recentPayments,
      monthlyTrend,
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })

  } catch (error) {
    console.error('Revenue analytics error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch revenue analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
