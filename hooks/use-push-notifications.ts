/**
 * Hook for managing push notifications
 */

import { useState, useEffect, useCallback } from 'react'

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export function usePushNotifications(userId: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if push is supported
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setIsSupported(supported)

    if (supported && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Load existing subscription
  useEffect(() => {
    if (!isSupported || !userId) return

    const loadSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.getSubscription()

        if (sub) {
          const p256dh = btoa(
            String.fromCharCode(...new Uint8Array(sub.getKey('p256dh') || new ArrayBuffer(0)))
          )
          const auth = btoa(
            String.fromCharCode(...new Uint8Array(sub.getKey('auth') || new ArrayBuffer(0)))
          )

          setSubscription({
            endpoint: sub.endpoint,
            keys: { p256dh, auth },
          })
        }
      } catch (error) {
        console.error('Failed to load push subscription:', error)
      }
    }

    loadSubscription()
  }, [isSupported, userId])

  // Request permission and subscribe
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId) {
      return false
    }

    setIsLoading(true)

    try {
      // Request notification permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setIsLoading(false)
        return false
      }

      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        setIsLoading(false)
        return false
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Convert VAPID key
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
      }

      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Convert to our format
      const p256dh = btoa(
        String.fromCharCode(...new Uint8Array(sub.getKey('p256dh') || new ArrayBuffer(0)))
      )
      const auth = btoa(
        String.fromCharCode(...new Uint8Array(sub.getKey('auth') || new ArrayBuffer(0)))
      )

      const pushSub: PushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh, auth },
      }

      // Save to backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: pushSub,
        }),
      })

      setSubscription(pushSub)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      setIsLoading(false)
      return false
    }
  }, [isSupported, userId])

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId) {
      return false
    }

    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()

      if (sub) {
        await sub.unsubscribe()
      }

      // Remove from backend
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      setSubscription(null)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      setIsLoading(false)
      return false
    }
  }, [isSupported, userId])

  return {
    isSupported,
    permission,
    subscription,
    isSubscribed: !!subscription,
    isLoading,
    requestPermission,
    unsubscribe,
  }
}
