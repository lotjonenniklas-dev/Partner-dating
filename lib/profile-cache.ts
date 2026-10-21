/**
 * Profile cache - loads profiles at startup and keeps them in memory
 */

import { people, type Person } from './people'
import { loadAllProfiles } from './load-profiles'

let cachedProfiles: Person[] = [...people]
let isLoading = false
let lastLoadTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get all cached profiles
 */
export function getCachedProfiles(): Person[] {
  return cachedProfiles
}

/**
 * Find a person by ID from cache
 */
export function findCachedPerson(id: string): Person | undefined {
  return cachedProfiles.find(p => p.id === id)
}

/**
 * Load profiles from Supabase and update cache
 * Safe to call multiple times - won't reload if recently loaded
 */
export async function refreshProfileCache(force = false): Promise<void> {
  const now = Date.now()
  
  // Don't reload if we loaded recently (unless forced)
  if (!force && isLoading) {
    console.log('[Profile Cache] Already loading, skipping')
    return
  }
  
  if (!force && now - lastLoadTime < CACHE_DURATION) {
    console.log('[Profile Cache] Cache still fresh, skipping')
    return
  }

  try {
    isLoading = true
    console.log('[Profile Cache] Loading profiles...')
    
    const profiles = await loadAllProfiles()
    cachedProfiles = profiles
    lastLoadTime = now
    
    console.log(`[Profile Cache] ✅ Loaded ${profiles.length} profiles`)
    
    // Refresh the discovery ranker with new profiles
    try {
      const { refreshRanker } = await import('./store')
      refreshRanker()
      console.log('[Profile Cache] ✅ Ranker refreshed')
    } catch (err) {
      console.log('[Profile Cache] Could not refresh ranker (may not be imported yet)')
    }
  } catch (error) {
    console.error('[Profile Cache] Failed to load:', error)
    // Keep existing cache on error
  } finally {
    isLoading = false
  }
}

/**
 * Initialize profile cache on app startup
 * Call this once when the app loads
 */
export function initProfileCache(): void {
  if (typeof window === 'undefined') return
  
  // Load immediately on startup
  refreshProfileCache(true).catch(console.error)
  
  // Refresh every 5 minutes in background
  setInterval(() => {
    refreshProfileCache(false).catch(console.error)
  }, CACHE_DURATION)
}

/**
 * Get profile catalog index function for matching algorithm
 */
export function getCatalogIndex(): (id: string) => number {
  const index = new Map<string, number>()
  cachedProfiles.forEach((p, i) => {
    index.set(p.id, i)
  })
  return (id: string) => index.get(id) ?? Number.MAX_SAFE_INTEGER
}
