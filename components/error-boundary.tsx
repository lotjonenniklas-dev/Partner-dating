"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { logError } from "@/lib/firebase-crashlytics"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary to catch React errors and report them
 * Wraps the entire app to catch any unhandled errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Firebase/monitoring service
    logError(error, {
      componentStack: errorInfo.componentStack,
      type: "react-error-boundary",
    })
  }

  render() {
    if (this.state.hasError) {
      // Show fallback UI or custom error page
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "24px",
          textAlign: "center",
        }}>
          <h1 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "16px" }}>
            Jotain meni pieleen
          </h1>
          <p style={{ color: "#666", marginBottom: "24px" }}>
            Pahoittelumme! Sovellus kohtasi odottamattoman virheen.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined })
              window.location.href = "/"
            }}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Palaa etusivulle
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Global error handler for unhandled promise rejections
 * Call this in your app initialization
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason)
    logError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { type: "unhandled-rejection" }
    )
  })

  // Handle global errors
  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error)
    if (event.error instanceof Error) {
      logError(event.error, { type: "global-error" })
    }
  })
}
