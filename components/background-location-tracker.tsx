"use client"

import { useEffect } from "react"
import { useBackgroundLocation } from "@/lib/background-location"
import { usePartner } from "@/lib/store"

export function BackgroundLocationTracker() {
  const { me, updateMe } = usePartner()

  useBackgroundLocation((latitude, longitude) => {
    // Only update if location changed significantly (more than ~100 meters)
    const latDiff = Math.abs((me.latitude ?? 0) - latitude)
    const lngDiff = Math.abs((me.longitude ?? 0) - longitude)
    
    if (latDiff > 0.001 || lngDiff > 0.001 || me.latitude === null || me.longitude === null) {
      console.log("📍 Updating profile location:", { latitude, longitude })
      updateMe({
        ...me,
        latitude,
        longitude,
      })
    }
  })

  return null
}
