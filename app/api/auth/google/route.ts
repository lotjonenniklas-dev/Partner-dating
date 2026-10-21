import { isGoogleSession, type GoogleSession } from "@/lib/google-session"
import { readLimitedJson } from "@/lib/read-body"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export async function POST(request: Request) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  if (!clientId) return Response.json({ error: "client" }, { status: 503 })

  const read = await readLimitedJson(request)
  if ("error" in read) return Response.json({ error: "size" }, { status: 413 })
  const body = read.value as { credential?: unknown } | null
  const credential = body && typeof body.credential === "string" ? body.credential : ""
  if (!credential) return Response.json({ error: "credential" }, { status: 400 })

  const url = new URL("https://oauth2.googleapis.com/tokeninfo")
  url.searchParams.set("id_token", credential)
  const google = await fetch(url, { cache: "no-store" }).catch(() => null)
  if (!google?.ok) return Response.json({ error: "google" }, { status: 401 })

  const payload = (await google.json().catch(() => null)) as {
    aud?: unknown
    sub?: unknown
    email?: unknown
    name?: unknown
    picture?: unknown
    email_verified?: unknown
  } | null
  if (!payload || payload.aud !== clientId) return Response.json({ error: "audience" }, { status: 401 })
  if (payload.email_verified === "false") return Response.json({ error: "email" }, { status: 401 })
  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    return Response.json({ error: "profile" }, { status: 401 })
  }

  const session: GoogleSession = {
    sub: payload.sub,
    email: payload.email,
    name: typeof payload.name === "string" && payload.name ? payload.name : payload.email,
    picture: typeof payload.picture === "string" ? payload.picture : null,
    source: "google",
  }
  if (!isGoogleSession(session)) return Response.json({ error: "profile" }, { status: 401 })
  
  // Create or update user in Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', session.email)
        .single()
      
      if (!existingUser) {
        // Create new user
        const { error: userError } = await supabase
          .from('users')
          .insert([{ 
            email: session.email,
            last_seen_at: new Date().toISOString()
          }])
        
        if (userError) {
          console.error('Failed to create user in Supabase:', userError)
        }
      } else {
        // Update last seen
        await supabase
          .from('users')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('email', session.email)
      }
    } catch (error) {
      console.error('Supabase auth error:', error)
      // Continue even if Supabase fails - fallback to localStorage
    }
  }
  
  return Response.json(session)
}
