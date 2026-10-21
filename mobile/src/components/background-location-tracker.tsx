import { useEffect } from "react"
import { startBackgroundLocationTracking, getCurrentLocationOnce } from "../lib/background-location"
import { usePartner } from "../lib/store"

export function BackgroundLocationTracker() {
  const { me, updateMe } = usePartner()

  useEffect(() => {
    async function initLocation() {
      // Get current location immediately
      const location = await getCurrentLocationOnce()
      if (location) {
        updateMe({
          ...me,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
      }

      // Start background tracking
      const started = await startBackgroundLocationTracking()
      if (started) {
        console.log("✅ Background location tracking active")
      } else {
        console.log("⚠️ Background location tracking not available")
      }
    }

    initLocation()
  }, [])

  return null
}
