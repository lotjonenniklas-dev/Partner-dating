"use client"

import { useState } from "react"
import { MapPin, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentLocation, checkLocationPermission, type Coordinates } from "@/lib/geolocation"

type LocationPickerProps = {
  onLocationFound: (coords: Coordinates) => void
  currentCity: string
  disabled?: boolean
}

export function LocationPicker({ onLocationFound, currentCity, disabled }: LocationPickerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<string | null>(null)

  async function handleRequestLocation() {
    setLoading(true)
    setError(null)

    // Tarkista ensin lupa
    const permissionState = await checkLocationPermission()
    setPermission(permissionState)

    if (permissionState === "denied") {
      setError("Sijaintilupa on estetty. Salli sijainti selaimen asetuksista.")
      setLoading(false)
      return
    }

    // Hae sijainti
    const result = await getCurrentLocation()
    setLoading(false)

    if (result.success) {
      setError(null)
      onLocationFound(result.coords)
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleRequestLocation}
        disabled={disabled || loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Haetaan sijaintia...
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-4 w-4" />
            Käytä GPS-sijaintia
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {permission === "prompt" && !error && (
        <p className="text-xs text-muted-foreground">
          Selain kysyy lupaa käyttää sijaintiasi. GPS-sijainti mahdollistaa tarkimman etäisyyslaskennan.
        </p>
      )}
    </div>
  )
}
