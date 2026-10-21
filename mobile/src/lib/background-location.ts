import * as Location from "expo-location"
import * as TaskManager from "expo-task-manager"
import { usePartner } from "./store"

const LOCATION_TASK_NAME = "background-location-task"
const UPDATE_INTERVAL = 10 * 60 * 1000 // 10 minutes

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error("Background location error:", error)
    return
  }
  if (data) {
    const { locations } = data
    const location = locations[0]
    if (location) {
      console.log("📍 Background location update:", location.coords)
      
      // Update the store with new location
      const store = usePartner.getState?.()
      if (store && store.updateMe) {
        store.updateMe({
          ...store.me,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
      }
    }
  }
})

export async function requestBackgroundLocationPermission(): Promise<boolean> {
  try {
    // First request foreground permission
    const foreground = await Location.requestForegroundPermissionsAsync()
    if (foreground.status !== "granted") {
      console.log("Foreground location permission denied")
      return false
    }

    // Then request background permission
    const background = await Location.requestBackgroundPermissionsAsync()
    if (background.status !== "granted") {
      console.log("Background location permission denied")
      return false
    }

    console.log("✅ Background location permissions granted")
    return true
  } catch (error) {
    console.error("Error requesting location permissions:", error)
    return false
  }
}

export async function startBackgroundLocationTracking(): Promise<boolean> {
  try {
    // Check if already running
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
    if (isTracking) {
      console.log("Background location tracking already active")
      return true
    }

    // Request permissions
    const hasPermission = await requestBackgroundLocationPermission()
    if (!hasPermission) {
      return false
    }

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: UPDATE_INTERVAL,
      distanceInterval: 100, // Update if moved 100 meters
      foregroundService: {
        notificationTitle: "Partner",
        notificationBody: "Päivittää sijaintia taustalla",
      },
    })

    console.log("✅ Background location tracking started")
    return true
  } catch (error) {
    console.error("Error starting background location:", error)
    return false
  }
}

export async function stopBackgroundLocationTracking(): Promise<void> {
  try {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
    if (isTracking) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
      console.log("Background location tracking stopped")
    }
  } catch (error) {
    console.error("Error stopping background location:", error)
  }
}

export async function getCurrentLocationOnce(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      return null
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
    
    console.log("📍 Current location:", location.coords)
    return location
  } catch (error) {
    console.error("Error getting current location:", error)
    return null
  }
}
