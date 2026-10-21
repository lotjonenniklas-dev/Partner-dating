/**
 * GPS-pohjainen sijaintitoiminnallisuus
 */

export type Coordinates = {
  latitude: number
  longitude: number
}

export type LocationResult =
  | { success: true; coords: Coordinates; accuracy: number }
  | { success: false; error: string; code?: string }

/**
 * Pyytää käyttäjän nykyisen GPS-sijainnin
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  if (!("geolocation" in navigator)) {
    return {
      success: false,
      error: "Selaimesi ei tue sijaintipalvelua",
      code: "NOT_SUPPORTED",
    }
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        error: "Sijainnin haku kesti liian kauan",
        code: "TIMEOUT",
      })
    }, 10000) // 10 sekunnin timeout

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId)
        resolve({
          success: true,
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        clearTimeout(timeoutId)
        let errorMessage = "Sijaintia ei voitu hakea"
        let errorCode = "UNKNOWN"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Sijaintilupa evätty"
            errorCode = "PERMISSION_DENIED"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Sijaintitietoja ei ole saatavilla"
            errorCode = "POSITION_UNAVAILABLE"
            break
          case error.TIMEOUT:
            errorMessage = "Sijainnin haku aikakatkaistiin"
            errorCode = "TIMEOUT"
            break
        }

        resolve({
          success: false,
          error: errorMessage,
          code: errorCode,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000, // Hyväksy 5 min vanha sijainti
      },
    )
  })
}

/**
 * Tarkistaa onko sijaintilupa jo myönnetty
 */
export async function checkLocationPermission(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
  if (!("permissions" in navigator)) return "unsupported"

  try {
    const result = await navigator.permissions.query({ name: "geolocation" })
    return result.state
  } catch {
    return "unsupported"
  }
}

/**
 * Tarkistaa localStorage:sta onko käyttäjä jo vastannut sijaintilupaan
 */
function hasLocationBeenRequested(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('location_requested') === 'true'
}

/**
 * Merkitsee localStorage:iin että sijaintilupa on jo kysytty
 */
function markLocationAsRequested() {
  if (typeof window === 'undefined') return
  localStorage.setItem('location_requested', 'true')
}

/**
 * Pyytää sijaintia vain jos lupaa ei ole vielä kysytty tai se on granted
 */
export async function getCurrentLocationIfAllowed(): Promise<LocationResult | null> {
  // Tarkista lupa ensin
  const permission = await checkLocationPermission()
  
  // Jos lupa evätty, älä kysy uudestaan
  if (permission === 'denied') {
    console.log('📍 Location permission denied, not requesting again')
    return null
  }
  
  // Jos lupa myönnetty, hae sijainti
  if (permission === 'granted') {
    return getCurrentLocation()
  }
  
  // Jos "prompt" (ei vielä kysytty), tarkista onko jo kysytty aiemmin
  if (permission === 'prompt') {
    if (hasLocationBeenRequested()) {
      // Käyttäjä on jo nähnyt kyselyn, ei kysytä uudestaan
      console.log('📍 Location already requested before, not asking again')
      return null
    }
    
    // Ensimmäinen kerta - kysy nyt
    console.log('📍 Requesting location for the first time')
    markLocationAsRequested()
    return getCurrentLocation()
  }
  
  return null
}

/**
 * Haversine-kaava: laskee etäisyyden kahden GPS-koordinaatin välillä kilometreinä
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371 // Maapallon säde kilometreinä

  const dLat = toRad(coord2.latitude - coord1.latitude)
  const dLon = toRad(coord2.longitude - coord1.longitude)
  const lat1 = toRad(coord1.latitude)
  const lat2 = toRad(coord2.latitude)

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)))

  return R * c
}

/**
 * Muotoilee etäisyyden käyttäjäystävällisesti
 */
export function formatDistance(km: number): string {
  if (km < 1) return "alle 1 km"
  if (km < 10) return `${Math.round(km)} km`
  return `${Math.round(km / 5) * 5} km`
}

/**
 * Reverse geocoding: yrittää muuntaa koordinaatit kaupunkinimeksi
 * (Tämä tarvitsisi API:n kuten OpenStreetMap Nominatim, mutta jätetään toistaiseksi)
 */
export async function reverseGeocode(coords: Coordinates): Promise<string | null> {
  // Tässä voisi käyttää esim. Nominatim API:a:
  // https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json
  // Mutta jätetään toistaiseksi, jotta ei tule rate limit -ongelmia
  return null
}
