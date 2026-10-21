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

    // Delete all user data from Supabase
    const deletions = await Promise.all([
      // Delete messages where user is sender or receiver
      supabase.from("messages").delete().or(`from.eq.${deviceId},to.eq.${deviceId}`),
      
      // Delete push subscriptions
      supabase.from("push_subscriptions").delete().eq("device_id", deviceId),
      
      // Delete reports made by this user
      supabase.from("reports").delete().eq("reporter_device_id", deviceId),
      
      // Note: Reports ABOUT this user are kept for moderation records
    ])

    // Check if any deletions failed
    const errors = deletions.filter((result) => result.error)
    if (errors.length > 0) {
      console.error("Some deletions failed:", errors)
      return Response.json(
        { 
          success: false, 
          error: "Some data could not be deleted",
          details: errors 
        },
        { status: 500 }
      )
    }

    // Count deleted items
    const messagesCount = deletions[0].count ?? 0
    const pushSubsCount = deletions[1].count ?? 0
    const reportsCount = deletions[2].count ?? 0

    return Response.json({
      success: true,
      message: "All data deleted successfully",
      deletedItems: {
        messages: messagesCount,
        pushSubscriptions: pushSubsCount,
        reports: reportsCount,
      },
    })
  } catch (error) {
    console.error("Delete account error:", error)
    return Response.json({ error: "Account deletion failed" }, { status: 500 })
  }
}
