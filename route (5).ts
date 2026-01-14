import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Disable body parsing, need raw body for webhook signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getRawBody(request: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  const reader = request.body?.getReader()
  
  if (!reader) {
    throw new Error('No request body')
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  return Buffer.concat(chunks)
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await getRawBody(req)
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseAdmin()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get customer and subscription details
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string
        const userId = session.metadata?.user_id

        if (!userId) {
          console.error('No user_id in session metadata')
          break
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0].price.id

        // Determine tier based on price
        let tier: 'starter' | 'professional' = 'starter'
        if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY) {
          tier = 'professional'
        }

        // Create or update business profile
        const { error: businessError } = await supabase
          .from('businesses')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: subscription.status,
            subscription_tier: tier,
            subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (businessError) {
          console.error('Error updating business:', businessError)
        }

        console.log(`✅ Checkout completed for user ${userId}, tier: ${tier}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const priceId = subscription.items.data[0].price.id

        let tier: 'starter' | 'professional' = 'starter'
        if (priceId === process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY) {
          tier = 'professional'
        }

        // Update subscription in database
        const { error } = await supabase
          .from('businesses')
          .update({
            subscription_status: subscription.status,
            subscription_tier: tier,
            subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating subscription:', error)
        }

        console.log(`✅ Subscription updated for customer ${customerId}, status: ${subscription.status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Mark subscription as cancelled
        const { error } = await supabase
          .from('businesses')
          .update({
            subscription_status: 'canceled',
            subscription_tier: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error cancelling subscription:', error)
        }

        console.log(`✅ Subscription cancelled for customer ${customerId}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const subscriptionId = invoice.subscription as string

        // Log successful payment
        const { error } = await supabase
          .from('payment_history')
          .insert({
            stripe_customer_id: customerId,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'succeeded',
            paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
          })

        if (error) {
          console.error('Error logging payment:', error)
        }

        console.log(`✅ Payment succeeded for customer ${customerId}, amount: ${invoice.amount_paid}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Update subscription status
        const { error } = await supabase
          .from('businesses')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating payment failure:', error)
        }

        // Log failed payment
        await supabase
          .from('payment_history')
          .insert({
            stripe_customer_id: customerId,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: 'failed',
            paid_at: new Date().toISOString(),
          })

        console.log(`⚠️ Payment failed for customer ${customerId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
