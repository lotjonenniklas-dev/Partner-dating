import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { validateMessage } from "@/lib/message-filter"

export const runtime = "nodejs"

// Hae viestit kahden käyttäjän välillä
export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const myDevice = searchParams.get("my_device")
  const otherDevice = searchParams.get("other_device")

  if (!myDevice || !otherDevice) {
    return NextResponse.json({ error: "Missing device IDs" }, { status: 400 })
  }

  // Hae viestit molempiin suuntiin
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(from_device.eq.${myDevice},to_device.eq.${otherDevice}),and(from_device.eq.${otherDevice},to_device.eq.${myDevice})`)
    .order("created_at", { ascending: true })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: data || [] })
}

// Lähetä viesti
export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  }

  const body = await request.json()
  const { from_device, to_device, text } = body

  if (!from_device || !to_device || !text || typeof text !== "string" || text.length > 1000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 })
  }

  // Validate message content (check for URLs, etc.)
  const validation = validateMessage(text)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("messages")
    .insert([{ from_device, to_device, text }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: data })
}
