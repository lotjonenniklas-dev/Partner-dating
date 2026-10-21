/**
 * Hook to load real matches from Supabase and merge with localStorage
 */

import { useEffect, useState } from 'react'
import { getMatches, getProfile, getPhotos } from '@/lib/supabase-helpers'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getOrCreateUser } from '@/lib/supabase-helpers'
import type { Person } from '@/lib/people'

export function useSupabaseMatches(enabled: boolean = true) {
  const [supabaseMatches, setSupabaseMatches] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) return

    let cancelled = false

    async function loadMatches() {
      try {
        setLoading(true)
        
        // Get current user
        const sessionJson = localStorage.getItem('GOOGLE_SESSION')
        if (!sessionJson) return
        
        const session = JSON.parse(sessionJson)
        const email = session.email
        if (!email) return
        
        const userId = await getOrCreateUser(email)
        if (!userId || cancelled) return
        
        // Get match IDs from Supabase
        const matchIds = await getMatches(userId)
        if (cancelled) return
        
        console.log(`[Supabase Matches] Found ${matchIds.length} matches`)
        
        // Load profiles for each match
        const matchProfiles: Person[] = []
        for (const matchId of matchIds) {
          if (cancelled) break
          
          const profile = await getProfile(matchId)
          if (!profile) continue
          
          const photos = await getPhotos(matchId)
          
          // Convert to Person format
          const hash = matchId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
          const colors = [
            { sky: '#e6eef3', skyDeep: '#c5d9e5', ground: '#f5e6d3' },
            { sky: '#fef3e2', skyDeep: '#f9ddb3', ground: '#e8f4ea' },
            { sky: '#f0f4f8', skyDeep: '#dae4ed', ground: '#ffe4e1' },
          ]
          const colorSet = colors[hash % colors.length]
          const hairStyles = ['bob', 'short', 'wavy', 'bun', 'crop', 'curls', 'tied'] as const
          const props = ['arch', 'pan', 'sketch', 'trail', 'boat', 'guitar', 'vase', 'bench'] as const
          
          matchProfiles.push({
            id: matchId,
            name: profile.name,
            age: profile.age || 25,
            city: profile.city || 'Helsinki',
            gender: profile.gender as any || 'nainen',
            sexuality: 'hetero' as any,
            attractedTo: profile.looking_for as any || 'kaikki',
            bio: profile.bio || '',
            interests: profile.interests || [],
            likesYou: true, // They matched with us!
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
          })
        }
        
        if (!cancelled) {
          setSupabaseMatches(matchProfiles)
          console.log(`[Supabase Matches] ✅ Loaded ${matchProfiles.length} match profiles`)
        }
      } catch (error) {
        console.error('[Supabase Matches] Failed to load:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadMatches()

    // Refresh every 30 seconds
    const interval = setInterval(loadMatches, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [enabled])

  return { supabaseMatches, loading }
}
