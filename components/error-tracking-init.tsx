"use client"

import { useEffect } from "react"
import { initializeFirebase, setUserId } from "@/lib/firebase-crashlytics"
import { setupGlobalErrorHandlers } from "@/components/error-boundary"

/**
 * Initialize error tracking and crash reporting
 * This component should be rendered once at the app root
 */
export function ErrorTrackingInit() {
  useEffect(() => {
    // Initialize Firebase
    initializeFirebase()

    // Setup global error handlers
    setupGlobalErrorHandlers()

    // Set user ID for crash reporting (using device ID)
    if (typeof window !== "undefined") {
      try {
        const deviceIdKey = Object.keys(localStorage).find((key) => key.startsWith("dev_"))
        if (deviceIdKey) {
          const deviceId = localStorage.getItem(deviceIdKey)
          if (deviceId) {
            setUserId(deviceId)
          }
        }
      } catch (e) {
        // Silently fail
      }
    }

    console.log("Error tracking initialized")
  }, [])

  return null
}
