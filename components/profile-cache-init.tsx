"use client"

import { useEffect } from "react"
import { initProfileCache } from "@/lib/profile-cache"

/**
 * Initialize profile cache on app startup
 * This loads profiles from Supabase and keeps them in memory
 */
export function ProfileCacheInit() {
  useEffect(() => {
    initProfileCache()
  }, [])

  return null
}
