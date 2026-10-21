/**
 * Push-tilausten hallinta Supabasessa
 */

import { supabase } from "./supabase"

export type PushSubscription = {
  device_id: string
  endpoint: string
  p256dh: string
  auth: string
  updated_at: string
}

/**
 * Tallentaa push-tilauksen Supabaseen
 */
export async function savePushSubscription(
  deviceId: string,
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  },
): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          device_id: deviceId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "device_id" },
      )

    return !error
  } catch {
    return false
  }
}

/**
 * Hakee toisen käyttäjän push-tilauksen
 */
export async function getPushSubscription(deviceId: string): Promise<PushSubscription | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("device_id", deviceId)
      .single()

    if (error || !data) return null
    return data as PushSubscription
  } catch {
    return null
  }
}

/**
 * Lähettää push-ilmoituksen toiselle laitteelle
 */
export async function sendPushToDevice(
  targetDeviceId: string,
  notification: {
    title: string
    body: string
    url: string
    tag?: string
  },
): Promise<boolean> {
  const subscription = await getPushSubscription(targetDeviceId)
  if (!subscription) return false

  try {
    const response = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        title: notification.title,
        body: notification.body,
        url: notification.url,
        tag: notification.tag,
      }),
    })

    return response.ok
  } catch {
    return false
  }
}
