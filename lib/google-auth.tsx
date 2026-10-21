"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  GOOGLE_SESSION_KEY,
  isGoogleSession,
  previewSession,
  type GoogleSession,
} from "@/lib/google-session"

type GoogleAuthValue = {
  ready: boolean
  session: GoogleSession | null
  clientId: string
  signIn: (session: GoogleSession) => void
  signInPreview: () => void
  signOut: () => void
}

const GoogleAuthContext = createContext<GoogleAuthValue | null>(null)

function readSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GOOGLE_SESSION_KEY) || "null")
    return isGoogleSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<GoogleSession | null>(null)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

  useEffect(() => {
    setSession(readSession())
    setReady(true)
  }, [])

  const value = useMemo<GoogleAuthValue>(() => {
    function signIn(next: GoogleSession) {
      localStorage.setItem(GOOGLE_SESSION_KEY, JSON.stringify(next))
      setSession(next)
    }
    return {
      ready,
      session,
      clientId,
      signIn,
      signInPreview: () => {
        signIn(previewSession())
        // Reload to apply session
        if (typeof window !== "undefined") {
          window.location.reload()
        }
      },
      signOut: () => {
        localStorage.removeItem(GOOGLE_SESSION_KEY)
        setSession(null)
        // Redirect to login page
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      },
    }
  }, [ready, session, clientId])

  return <GoogleAuthContext.Provider value={value}>{children}</GoogleAuthContext.Provider>
}

export function useGoogleAuth() {
  const value = useContext(GoogleAuthContext)
  if (!value) throw new Error("useGoogleAuth täytyy kutsua GoogleAuthProviderin sisällä")
  return value
}
