/**
 * Hook to load chat messages from Supabase and sync in real-time
 */

import { useEffect, useState } from 'react'
import { getMessages, getOrCreateUser, checkMatch, getMatchId } from '@/lib/supabase-helpers'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { ChatMessage } from '@/lib/store'

export function useSupabaseChat(personId: string, enabled: boolean = true) {
  const [supabaseMessages, setSupabaseMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [isMatch, setIsMatch] = useState(false)

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured() || !personId) return

    let cancelled = false

    async function loadMessages() {
      try {
        // Get current user
        const sessionJson = localStorage.getItem('GOOGLE_SESSION')
        if (!sessionJson) return
        
        const session = JSON.parse(sessionJson)
        const email = session.email
        if (!email) return
        
        const userId = await getOrCreateUser(email)
        if (!userId || cancelled) return
        
        // Get the real match ID from database
        const matchId = await getMatchId(userId, personId)
        
        if (!matchId) {
          console.log('[Supabase Chat] Not matched yet, skipping message load')
          setIsMatch(false)
          return
        }
        
        setIsMatch(true)
        
        // Load messages using the real match ID
        const messages = await getMessages(matchId)
        if (cancelled) return
        
        // Convert to ChatMessage format
        const chatMessages: ChatMessage[] = messages.map(msg => ({
          id: msg.id,
          from: msg.sender_id === userId ? 'me' as const : 'them' as const,
          text: msg.content,
          at: new Date(msg.created_at).getTime(),
        }))
        
        setSupabaseMessages(chatMessages)
        console.log(`[Supabase Chat] ✅ Loaded ${chatMessages.length} messages`)
      } catch (error) {
        console.error('[Supabase Chat] Failed to load:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    setLoading(true)
    loadMessages()

    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [personId, enabled])

  return { supabaseMessages, loading, isMatch }
}
