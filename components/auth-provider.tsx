"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { GOOGLE_SESSION_KEY, previewSession } from "@/lib/google-session"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Public routes that don't require auth
    const publicRoutes = ["/login", "/tietosuoja", "/ehdot"]
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

    if (isPublicRoute) {
      setIsChecking(false)
      return
    }

    // Check if user is logged in
    const session = localStorage.getItem(GOOGLE_SESSION_KEY)
    
    if (!session) {
      // TEMPORARY: Auto-login with device session for testing
      // Remove this when Google Auth is configured
      const deviceSession = previewSession()
      localStorage.setItem(GOOGLE_SESSION_KEY, JSON.stringify(deviceSession))
      setIsChecking(false)
    } else {
      setIsChecking(false)
    }
  }, [pathname, router])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-pulse">💕</div>
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Ladataan...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
