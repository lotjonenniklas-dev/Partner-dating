import { after } from "next/server"
import webpush from "web-push"
import { pushKeys } from "./keys"

export const runtime = "nodejs"
export const maxDuration = 30

webpush.setVapidDetails("mailto:notifications@partner.app", pushKeys.publicKey, pushKeys.privateKey)

type PushBody = {
  subscription?: {
    endpoint?: unknown
    keys?: { p256dh?: unknown; auth?: unknown }
  }
  title?: unknown
  body?: unknown
  url?: unknown
  tag?: unknown
  delayMs?: unknown
}

function text(value: unknown, max: number) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > max) return null
  return trimmed
}

function appPath(value: unknown) {
  if (typeof value !== "string" || value.length > 200) return null
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return null
  return value
}

export function GET() {
  return Response.json({ publicKey: pushKeys.publicKey })
}

export async function POST(request: Request) {
  let payload: PushBody
  try {
    payload = (await request.json()) as PushBody
  } catch {
    return Response.json({ error: "Ilmoitusta ei voitu lähettää." }, { status: 400 })
  }

  const endpoint = payload.subscription?.endpoint
  const p256dh = payload.subscription?.keys?.p256dh
  const auth = payload.subscription?.keys?.auth
  const title = text(payload.title, 80)
  const body = text(payload.body, 180)
  const url = appPath(payload.url)
  const tag = text(payload.tag, 80) ?? url
  if (
    typeof endpoint !== "string" ||
    !endpoint.startsWith("https://") ||
    typeof p256dh !== "string" ||
    typeof auth !== "string" ||
    !title ||
    !body ||
    !url
  ) {
    return Response.json({ error: "Ilmoitusta ei voitu lähettää." }, { status: 400 })
  }

  const requested =
    typeof payload.delayMs === "number" && Number.isFinite(payload.delayMs) ? payload.delayMs : 0
  const delayMs = Math.min(20000, Math.max(0, Math.round(requested)))
  const message = JSON.stringify({ title, body, url, tag })
  const send = async () => {
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
    await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, message)
  }

  if (delayMs > 0) {
    after(() => send().catch(() => undefined))
    return Response.json({ ok: true })
  }

  try {
    await send()
  } catch {
    return Response.json({ error: "Ilmoitusta ei voitu lähettää." }, { status: 502 })
  }

  return Response.json({ ok: true })
}
