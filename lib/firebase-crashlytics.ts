"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"

// Firebase configuration
// Get these from Firebase Console: https://console.firebase.google.com
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: FirebaseApp | null = null

/**
 * Initialize Firebase if not already initialized
 */
export function initializeFirebase() {
  if (typeof window === "undefined") return null
  
  // Check if already initialized
  if (getApps().length > 0) {
    return getApps()[0]
  }

  // Check if config is available
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn("Firebase not configured - crash reporting disabled")
    return null
  }

  try {
    firebaseApp = initializeApp(firebaseConfig)
    console.log("Firebase initialized successfully")
    return firebaseApp
  } catch (error) {
    console.error("Firebase initialization error:", error)
    return null
  }
}

/**
 * Log an error to Firebase (and console)
 */
export function logError(error: Error, context?: Record<string, any>) {
  console.error("Error:", error, context)

  // In production, send to Firebase/monitoring service
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    try {
      // Send error to API endpoint for server-side logging
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      }).catch((e) => {
        // Silently fail - don't block user experience
        console.error("Failed to log error:", e)
      })
    } catch (e) {
      // Silently fail
    }
  }
}

/**
 * Log a custom event/message
 */
export function logEvent(eventName: string, params?: Record<string, any>) {
  if (process.env.NODE_ENV === "development") {
    console.log("Event:", eventName, params)
  }

  // In production, send to analytics
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    try {
      fetch("/api/log-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName,
          params,
          timestamp: Date.now(),
        }),
      }).catch(() => {
        // Silently fail
      })
    } catch (e) {
      // Silently fail
    }
  }
}

/**
 * Set user ID for crash reporting
 */
export function setUserId(userId: string) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("crash_user_id", userId)
    } catch (e) {
      // Silently fail
    }
  }
}

/**
 * Get user ID for crash reporting
 */
export function getUserId(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem("crash_user_id")
  } catch (e) {
    return null
  }
}
