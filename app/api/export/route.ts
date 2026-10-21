import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceId } = body

    if (!deviceId) {
      return Response.json({ error: "Device ID required" }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch all user data from Supabase
    const [messagesResult, pushSubsResult, reportsResult] = await Promise.all([
      supabase.from("messages").select("*").or(`from.eq.${deviceId},to.eq.${deviceId}`),
      supabase.from("push_subscriptions").select("*").eq("device_id", deviceId),
      supabase.from("reports").select("*").eq("reporter_device_id", deviceId),
    ])

    // Get local storage data from request
    const { profile, matches, likes, settings } = body

    // Compile all data
    const exportData = {
      exportDate: new Date().toISOString(),
      deviceId,
      profile: profile || null,
      messages: messagesResult.data || [],
      matches: matches || [],
      likes: likes || [],
      pushSubscriptions: pushSubsResult.data || [],
      reports: reportsResult.data || [],
      settings: settings || {},
    }

    return Response.json({
      success: true,
      data: exportData,
      fileName: `partner-data-${deviceId.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.json`,
    })
  } catch (error) {
    console.error("Export error:", error)
    return Response.json({ error: "Export failed" }, { status: 500 })
  }
}
