"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GOOGLE_SESSION_KEY, type GoogleSession } from "@/lib/google-session"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if already logged in
    const existing = localStorage.getItem(GOOGLE_SESSION_KEY)
    if (existing) {
      router.push("/")
      return
    }

    // Load Google Sign-In script
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [router])

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      setError("Google Client ID ei ole konfiguroitu")
      return
    }

    // Initialize Google Sign-In when script loads
    const initGoogle = () => {
      if (typeof window === "undefined" || !(window as any).google) return

      ;(window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      })

      ;(window as any).google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        {
          theme: "outline",
          size: "large",
          text: "signin_with",
          width: 300,
          locale: "fi",
        }
      )
    }

    // Wait for script to load
    const checkGoogle = setInterval(() => {
      if ((window as any).google) {
        clearInterval(checkGoogle)
        initGoogle()
      }
    }, 100)

    return () => clearInterval(checkGoogle)
  }, [])

  const handleCredentialResponse = async (response: any) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      })

      if (!res.ok) {
        throw new Error("Kirjautuminen epäonnistui")
      }

      const session: GoogleSession = await res.json()
      localStorage.setItem(GOOGLE_SESSION_KEY, JSON.stringify(session))

      // Redirect to home
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kirjautuminen epäonnistui")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 space-y-8">
          {/* Logo/Header */}
          <div className="text-center space-y-2">
            <div className="text-6xl mb-4">💕</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tervetuloa Partner-appiin
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Löydä uusia ihmisiä lähelläsi
            </p>
          </div>

          {/* Google Sign-In Button */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div id="googleSignInButton"></div>
            </div>

            {loading && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-pink-500 border-t-transparent"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Kirjaudutaan sisään...
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  ⚠️ {error}
                </p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Nopea ja turvallinen kirjautuminen Google-tilillä</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Profiilisi synkronoituu kaikkiin laitteisiisi</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Ei häviä vaikka poistaisit sovelluksen</span>
            </p>
          </div>

          {/* Terms */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-500">
            Kirjautumalla hyväksyt{" "}
            <a href="/ehdot" className="text-pink-500 hover:underline">
              käyttöehdot
            </a>{" "}
            ja{" "}
            <a href="/tietosuoja" className="text-pink-500 hover:underline">
              tietosuojakäytännön
            </a>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          💡 Vinkki: Voit asentaa sovelluksen kotinäytöllesi!
        </p>
      </div>
    </div>
  )
}
