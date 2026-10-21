"use client"

import { useEffect, useRef } from "react"
import { getCurrentLocationIfAllowed } from "./geolocation"

const UPDATE_INTERVAL = 10 * 60 * 1000 // 10 minutes

export function useBackgroundLocation(onLocationUpdate: (lat: number, lng: number) => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isUpdating = useRef(false)

  useEffect(() => {
    async function updateLocation() {
      if (isUpdating.current) return
      isUpdating.current = true

      try {
        const result = await getCurrentLocationIfAllowed()
        if (result?.success && result.coords) {
          onLocationUpdate(result.coords.latitude, result.coords.longitude)
          console.log("📍 Location updated:", result.coords)
        } else if (result === null) {
          // Permission denied or already asked - skip silently
          console.log("📍 Skipping location update (no permission)")
        }
      } catch (error) {
        console.error("Background location update failed:", error)
      } finally {
        isUpdating.current = false
      }
    }

    // Update immediately on mount
    updateLocation()

    // Then update every 10 minutes
    intervalRef.current = setInterval(updateLocation, UPDATE_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [onLocationUpdate])
}

// For one-time updates on navigation
export async function updateLocationNow(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const result = await getCurrentLocationIfAllowed()
    if (result?.success && result.coords) {
      console.log("📍 Location updated on navigation:", result.coords)
      return result.coords
    }
  } catch (error) {
    console.error("Location update failed:", error)
  }
  return null
}
