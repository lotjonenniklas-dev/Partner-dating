import { acceptsGooglePayToken, googlePayConfig, LIKE_PASS_PRICE, LIKE_PASS_CURRENCY } from "@/lib/google-pay"
import { readLimitedJson } from "@/lib/read-body"
import { chargeGooglePayToken, priceInCents, isStripeConfigured } from "@/lib/stripe-client"

export async function POST(request: Request) {
  const read = await readLimitedJson(request)
  if ("error" in read) return Response.json({ ok: false }, { status: 413 })
  
  const body = read.value as { token?: unknown } | null
  const token = body && typeof body.token === "string" ? body.token : ""
  
  const config = googlePayConfig()
  if (!acceptsGooglePayToken(config, token)) {
    return Response.json({ ok: false, error: 'Invalid payment token' }, { status: 402 })
  }
  
  // TEST MODE: Always succeed (no real charge)
  if (config.environment === 'TEST') {
    console.log('[Payment] ⚠️ TEST MODE - No real charge, simulating success')
    return Response.json({ 
      ok: true, 
      testMode: true,
      message: 'Test payment successful (no real charge)'
    })
  }
  
  // PRODUCTION MODE: Charge through Stripe
  if (isStripeConfigured() && config.environment === 'PRODUCTION') {
    console.log('[Payment] Processing REAL payment through Stripe...')
    
    const amount = priceInCents(parseFloat(LIKE_PASS_PRICE))
    const result = await chargeGooglePayToken(
      token,
      amount,
      LIKE_PASS_CURRENCY.toLowerCase(),
      'Partner - Rajaton päivä'
    )
    
    if (result.success) {
      console.log(`[Payment] ✅ Payment successful: ${result.chargeId}`)
      return Response.json({ 
        ok: true, 
        chargeId: result.chargeId,
        amount,
        currency: LIKE_PASS_CURRENCY 
      })
    } else {
      console.error(`[Payment] ❌ Payment failed: ${result.error}`)
      return Response.json({ 
        ok: false, 
        error: result.error || 'Payment failed' 
      }, { status: 402 })
    }
  }
  
  // Fallback - Stripe not configured in production
  console.error('[Payment] ❌ Stripe not configured in PRODUCTION mode!')
  return Response.json({ 
    ok: false, 
    error: 'Payment system not configured' 
  }, { status: 500 })
}
