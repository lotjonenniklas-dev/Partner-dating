/**
 * Stripe client for payment processing
 * Handles Google Pay token charges
 */

import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''

// Initialize Stripe client
export const stripe = stripeSecretKey && stripeSecretKey !== 'sk_test_placeholder'
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-09-30.endive',
    })
  : null

/**
 * Check if Stripe is properly configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null
}

/**
 * Charge a Google Pay token through Stripe
 * @param token - Google Pay payment token
 * @param amount - Amount in cents (280 = 2.80€)
 * @param currency - Currency code (default: EUR)
 * @param description - Payment description
 * @returns Stripe charge result
 */
export async function chargeGooglePayToken(
  token: string,
  amount: number,
  currency: string = 'eur',
  description: string = 'Partner - Päiväpassi'
): Promise<{ success: boolean; chargeId?: string; error?: string }> {
  if (!stripe) {
    console.error('[Stripe] Not configured - cannot process payment')
    return {
      success: false,
      error: 'Stripe not configured',
    }
  }

  try {
    console.log(`[Stripe] Processing charge: ${amount} ${currency.toUpperCase()}`)

    const charge = await stripe.charges.create({
      amount,
      currency,
      source: token,
      description,
    })

    if (charge.status === 'succeeded') {
      console.log(`[Stripe] ✅ Charge successful: ${charge.id}`)
      return {
        success: true,
        chargeId: charge.id,
      }
    } else {
      console.error(`[Stripe] ❌ Charge failed: ${charge.status}`)
      return {
        success: false,
        error: `Charge status: ${charge.status}`,
      }
    }
  } catch (error) {
    console.error('[Stripe] ❌ Charge error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
    }
  }
}

/**
 * Get price in cents
 * 2.80€ = 280 cents
 */
export function priceInCents(euros: number): number {
  return Math.round(euros * 100)
}
