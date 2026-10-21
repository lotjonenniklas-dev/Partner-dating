import { savePushSubscription } from "./push-subscriptions"
import { deviceId } from "./directory-client"

const SUB_KEY = "partner-push"
const TEST_KEY = "partner-push-test-v1"

export type Notice = {
  title: string
  body: string
  url: string
  tag?: string
}

type SubscriptionJson = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export function notificationSupport(): "ok" | "unsupported" | "ios" {
  if (typeof window === "undefined") return "unsupported"
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  if (ios && !standalone) return "ios"
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported"
  }
  return "ok"
}

export async function enableNotifications() {
  if (notificationSupport() !== "ok") return notificationSupport()
  const permission = await Notification.requestPermission()
  if (permission !== "granted") return permission
  const registration = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready
  const response = await fetch("/api/push")
  if (!response.ok) throw new Error("push")
  const { publicKey } = (await response.json()) as { publicKey?: string }
  if (!publicKey) throw new Error("push")
  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(publicKey),
    }))
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("push")
  const stored: SubscriptionJson = {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  }
  localStorage.setItem(SUB_KEY, JSON.stringify(stored))
  
  // Tallenna Supabaseen cross-device ilmoituksia varten
  const myDeviceId = deviceId()
  if (myDeviceId.startsWith("dev_")) {
    await savePushSubscription(myDeviceId, stored).catch(() => {
      // Ei haittaa jos tallennus epäonnistuu, ilmoitukset toimivat silti paikallisesti
    })
  }
  
  await pushNotice(
    { title: "Partner", body: "Ilmoitukset ovat päällä.", url: "/", tag: "partner-on" },
    { force: true },
  )
  void scheduleTestNotice()
  return "granted" as const
}

export async function scheduleTestNotice() {
  if (typeof window === "undefined") return
  if (localStorage.getItem(TEST_KEY) === "1") return
  if (notificationSupport() !== "ok") return
  if (!("Notification" in window) || Notification.permission !== "granted") return
  const subscription = await storedSubscription()
  if (!subscription) return
  try {
    const response = await fetch("/api/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subscription,
        title: "Partner",
        body: "Hei Niklas. Tämä on testiviesti, ilmoitukset toimivat.",
        url: "/matches",
        tag: "partner-test",
        delayMs: 15000,
      }),
    })
    if (response.ok) localStorage.setItem(TEST_KEY, "1")
  } catch {
    /* The next open tries the test again. */
  }
}

async function storedSubscription(): Promise<SubscriptionJson | null> {
  const saved = readSubscription()
  if (saved) return saved
  if (!("serviceWorker" in navigator)) return null
  const registration = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const json = existing?.toJSON()
  if (!json?.endpoint || !json.keys?.p256dh || !json.keys.auth) return null
  const stored: SubscriptionJson = {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  }
  localStorage.setItem(SUB_KEY, JSON.stringify(stored))
  return stored
}

export async function pushNotice(notice: Notice, options?: { force?: boolean }) {
  if (typeof window === "undefined") return
  if (!("Notification" in window) || Notification.permission !== "granted") return
  const path = notice.url.split("?")[0]
  if (!options?.force && document.visibilityState === "visible" && location.pathname === path) return

  const registration =
    "serviceWorker" in navigator ? await navigator.serviceWorker.register("/sw.js") : null
  const subscription = readSubscription()
  if (subscription) {
    try {
      const response = await fetch("/api/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subscription,
          title: notice.title,
          body: notice.body,
          url: notice.url,
          tag: notice.tag ?? path,
        }),
      })
      if (response.ok) return
    } catch {
      /* The phone still gets a local notification if the push service misses. */
    }
  }
  if (!registration) return
  await registration.showNotification(notice.title, {
    body: notice.body,
    icon: "/icon-192.png",
    lang: "fi",
    tag: notice.tag ?? path,
    data: { url: notice.url },
  })
}

function readSubscription(): SubscriptionJson | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(SUB_KEY) || "") as SubscriptionJson
    if (!parsed?.endpoint || !parsed.keys?.p256dh || !parsed.keys?.auth) return null
    return parsed
  } catch {
    return null
  }
}

function keyBytes(key: string) {
  const padding = "=".repeat((4 - (key.length % 4)) % 4)
  const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index)
  return bytes
}
