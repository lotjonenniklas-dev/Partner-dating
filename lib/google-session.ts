export type GoogleSession = {
  sub: string
  email: string
  name: string
  picture: string | null
  source: "google" | "preview"
}

export const GOOGLE_SESSION_KEY = "partner-google"

export function isGoogleSession(value: unknown): value is GoogleSession {
  if (!value || typeof value !== "object") return false
  const session = value as GoogleSession
  return (
    typeof session.sub === "string" &&
    session.sub.length > 0 &&
    typeof session.email === "string" &&
    typeof session.name === "string" &&
    session.name.length > 0 &&
    (session.picture === null || typeof session.picture === "string") &&
    (session.source === "google" || session.source === "preview")
  )
}

export function previewSession(): GoogleSession {
  return {
    sub: "preview",
    email: "",
    name: "Tämä selain",
    picture: null,
    source: "preview",
  }
}
