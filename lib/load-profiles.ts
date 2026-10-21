/**
 * Load profiles from Supabase and merge with mock data
 */

import { getAllProfiles, getPhotos, type SupabaseProfile } from './supabase-helpers'
import { isSupabaseConfigured } from './supabase'
import { people, type Person } from './people'

/**
 * Convert Supabase profile to Person format
 */
function profileToPerson(profile: SupabaseProfile, photos: string[]): Person | null {
  try {
    // Skip profiles without basic data
    if (!profile.name || !profile.age || !profile.gender) {
      return null
    }

    // Generate a scene with colors based on user ID hash
    const hash = profile.user_id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
    const colors = [
      { sky: '#e6eef3', skyDeep: '#c5d9e5', ground: '#f5e6d3' },
      { sky: '#fef3e2', skyDeep: '#f9ddb3', ground: '#e8f4ea' },
      { sky: '#f0f4f8', skyDeep: '#dae4ed', ground: '#ffe4e1' },
      { sky: '#fef7e6', skyDeep: '#f9e9c5', ground: '#e6f3f5' },
      { sky: '#f5f0f6', skyDeep: '#e4d9e9', ground: '#fff5e6' },
    ]
    const colorSet = colors[hash % colors.length]

    const hairStyles = ['bob', 'short', 'wavy', 'bun', 'crop', 'curls', 'tied'] as const
    const props = ['arch', 'pan', 'sketch', 'trail', 'boat', 'guitar', 'vase', 'bench'] as const

    return {
      id: profile.user_id,
      name: profile.name,
      age: profile.age,
      city: profile.city || 'Helsinki',
      gender: profile.gender as any,
      sexuality: 'hetero' as any, // Default
      attractedTo: profile.looking_for as any || 'kaikki',
      bio: profile.bio || '',
      interests: profile.interests || [],
      likesYou: false,
      opener: undefined,
      replies: [],
      scene: {
        ...colorSet,
        shirt: '#4a90e2',
        hair: '#2c1810',
        skin: '#f4d4b8',
        accent: '#ff6b6b',
        hairStyle: hairStyles[hash % hairStyles.length],
        prop: props[hash % props.length],
      },
    }
  } catch (error) {
    console.error('Error converting profile:', error)
    return null
  }
}

/**
 * Load all profiles for discovery feed
 * Returns Supabase profiles + mock data (when Supabase has few profiles)
 */
export async function loadAllProfiles(currentUserId?: string): Promise<Person[]> {
  // Always include mock data as fallback
  let allPeople: Person[] = [...people]

  // Try to load from Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      console.log('[Profiles] Loading from Supabase...')
      const profiles = await getAllProfiles(currentUserId, 100)
      
      if (profiles.length > 0) {
        console.log(`[Profiles] ✅ Loaded ${profiles.length} profiles from Supabase`)
        
        // Convert each profile to Person format
        const supabasePersons: Person[] = []
        for (const profile of profiles) {
          // Get photos for this profile
          const photos = await getPhotos(profile.user_id)
          const person = profileToPerson(profile, photos)
          if (person) {
            supabasePersons.push(person)
          }
        }
        
        // Merge: Supabase profiles first, then mock data
        // Remove duplicates by ID
        const seenIds = new Set(supabasePersons.map(p => p.id))
        const mockFiltered = people.filter(p => !seenIds.has(p.id))
        
        allPeople = [...supabasePersons, ...mockFiltered]
        console.log(`[Profiles] Total profiles: ${allPeople.length} (${supabasePersons.length} from DB, ${mockFiltered.length} mock)`)
      } else {
        console.log('[Profiles] No profiles in Supabase yet, using mock data')
      }
    } catch (error) {
      console.error('[Profiles] Failed to load from Supabase:', error)
      console.log('[Profiles] Falling back to mock data')
    }
  } else {
    console.log('[Profiles] Supabase not configured, using mock data')
  }

  return allPeople
}

/**
 * Find a specific profile by ID (checks Supabase first, then mock data)
 */
export async function findProfile(id: string): Promise<Person | null> {
  // Check mock data first (fast)
  const mockPerson = people.find(p => p.id === id)
  if (mockPerson) return mockPerson

  // Try Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { getProfile, getPhotos } = await import('./supabase-helpers')
      const profile = await getProfile(id)
      if (profile) {
        const photos = await getPhotos(id)
        return profileToPerson(profile, photos)
      }
    } catch (error) {
      console.error('[Profiles] Failed to find profile in Supabase:', error)
    }
  }

  return null
}
