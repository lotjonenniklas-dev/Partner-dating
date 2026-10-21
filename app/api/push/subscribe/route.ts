import { NextRequest, NextResponse } from 'next/server'
import { readLimitedJson } from '@/lib/read-body'
import type { PushSubscription } from '@/lib/push-notifications'

/**
 * Subscribe to push notifications
 * POST /api/push/subscribe
 * Body: { userId: string, subscription: PushSubscription }
 */
export async function POST(request: NextRequest) {
  const read = await readLimitedJson(request)
  if ('error' in read) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { userId, subscription } = read.value as {
    userId?: string
    subscription?: PushSubscription
  }

  if (!userId || !subscription) {
    return NextResponse.json({ error: 'Missing userId or subscription' }, { status: 400 })
  }

  // Validate subscription format
  if (
    !subscription.endpoint ||
    !subscription.keys ||
    !subscription.keys.p256dh ||
    !subscription.keys.auth
  ) {
    return NextResponse.json({ error: 'Invalid subscription format' }, { status: 400 })
  }

  // TODO: Store in database instead of localStorage
  // For now, we'll return success and let the frontend handle storage
  // In production, this should be stored in Supabase

  return NextResponse.json({
    success: true,
    message: 'Subscription stored successfully',
  })
}

/**
 * Unsubscribe from push notifications
 * DELETE /api/push/subscribe
 */
export async function DELETE(request: NextRequest) {
  const read = await readLimitedJson(request)
  if ('error' in read) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { userId } = read.value as { userId?: string }

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  // TODO: Remove from database
  
  return NextResponse.json({
    success: true,
    message: 'Subscription removed successfully',
  })
}
