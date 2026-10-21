import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Log errors to server for monitoring
 * In production, you would send these to a service like:
 * - Firebase Crashlytics
 * - Sentry
 * - LogRocket
 * - Custom logging service
 */
export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()

    // Log to console (in production, send to monitoring service)
    console.error("[CLIENT ERROR]", {
      message: errorData.message,
      stack: errorData.stack,
      context: errorData.context,
      url: errorData.url,
      userAgent: errorData.userAgent,
      timestamp: new Date(errorData.timestamp).toISOString(),
    })

    // TODO: In production, send to Firebase/Sentry/etc
    // Example:
    // await sendToFirebase(errorData)
    // await sendToSentry(errorData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging failed:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
