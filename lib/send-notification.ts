/**
 * Send push notification utility
 * Works with the existing /api/push endpoint
 */

/**
 * Send a push notification to a user
 */
export async function sendNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  notification: {
    title: string
    body: string
    url: string
    tag?: string
    delayMs?: number
  }
): Promise<boolean> {
  try {
    const response = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        title: notification.title,
        body: notification.body,
        url: notification.url,
        tag: notification.tag || notification.url,
        delayMs: notification.delayMs || 0,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Failed to send notification:', error)
    return false
  }
}

/**
 * Send match notification
 */
export async function sendMatchNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  matchName: string
): Promise<boolean> {
  return sendNotification(subscription, {
    title: '💕 Uusi match!',
    body: `Sinä ja ${matchName} matchaatitte!`,
    url: '/matches',
    tag: 'match',
    delayMs: 500, // Slight delay to ensure UI updates first
  })
}

/**
 * Send message notification
 */
export async function sendMessageNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  senderName: string,
  message: string,
  chatId: string
): Promise<boolean> {
  const preview = message.length > 50 ? message.substring(0, 50) + '...' : message

  return sendNotification(subscription, {
    title: `💬 ${senderName}`,
    body: preview,
    url: `/chat/${chatId}`,
    tag: `message-${chatId}`,
  })
}

/**
 * Get stored push subscription for a user (from localStorage)
 */
export function getStoredSubscription(userId: string): {
  endpoint: string
  keys: { p256dh: string; auth: string }
} | null {
  if (typeof window === 'undefined') return null

  try {
    const key = `push_subscription_${userId}`
    const stored = localStorage.getItem(key)
    if (!stored) return null

    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Send test notification (for debugging)
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      console.warn('No push subscription found')
      return false
    }

    const p256dh = btoa(
      String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') || new ArrayBuffer(0)))
    )
    const auth = btoa(
      String.fromCharCode(...new Uint8Array(subscription.getKey('auth') || new ArrayBuffer(0)))
    )

    return sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh, auth },
      },
      {
        title: '🔔 Testailmoitus',
        body: 'Push-ilmoitukset toimivat!',
        url: '/',
        tag: 'test',
      }
    )
  } catch (error) {
    console.error('Failed to send test notification:', error)
    return false
  }
}
