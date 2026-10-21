/**
 * Push Notifications Utility
 * Handles web push notifications for matches and messages
 */

import webpush from 'web-push'

// VAPID configuration
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:partner@example.com'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
}

/**
 * Send push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured')
    return false
  }

  try {
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      tag: payload.tag || 'partner-notification',
      icon: payload.icon || '/icon-192.png',
    })

    await webpush.sendNotification(subscription, notificationPayload)
    return true
  } catch (error) {
    console.error('Failed to send push notification:', error)
    return false
  }
}

/**
 * Send match notification
 */
export async function sendMatchNotification(
  subscription: PushSubscription,
  matchName: string,
  matchId: string
): Promise<boolean> {
  return sendPushNotification(subscription, {
    title: '💕 Uusi match!',
    body: `Sinä ja ${matchName} matchaatitte!`,
    url: `/matches`,
    tag: `match-${matchId}`,
  })
}

/**
 * Send message notification
 */
export async function sendMessageNotification(
  subscription: PushSubscription,
  senderName: string,
  message: string,
  chatId: string
): Promise<boolean> {
  const preview = message.length > 50 ? message.substring(0, 50) + '...' : message
  
  return sendPushNotification(subscription, {
    title: `💬 ${senderName}`,
    body: preview,
    url: `/chat/${chatId}`,
    tag: `message-${chatId}`,
  })
}

/**
 * Send like notification (for premium feature)
 */
export async function sendLikeNotification(
  subscription: PushSubscription,
  likerName: string
): Promise<boolean> {
  return sendPushNotification(subscription, {
    title: '❤️ Joku tykkäsi sinusta!',
    body: `${likerName} tykkäsi profiilistasi`,
    url: `/likes`,
    tag: 'new-like',
  })
}

/**
 * Store push subscription (localStorage for now, should be in database)
 */
export function storePushSubscription(userId: string, subscription: PushSubscription) {
  const key = `push_subscription_${userId}`
  localStorage.setItem(key, JSON.stringify(subscription))
}

/**
 * Get push subscription from storage
 */
export function getPushSubscription(userId: string): PushSubscription | null {
  const key = `push_subscription_${userId}`
  const stored = localStorage.getItem(key)
  if (!stored) return null
  
  try {
    return JSON.parse(stored) as PushSubscription
  } catch {
    return null
  }
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default'
  }
  return Notification.permission
}
