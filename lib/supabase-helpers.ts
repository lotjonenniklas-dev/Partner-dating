/**
 * Supabase helper functions for data operations
 */

import { supabase, isSupabaseConfigured } from './supabase'

export interface SupabaseProfile {
  user_id: string
  name: string
  age: number | null
  gender: string | null
  looking_for: string | null
  bio: string | null
  interests: string[]
  city: string | null
  education: string | null
  job: string | null
  height: number | null
  hometown: string | null
  politics: string | null
  religion: string | null
  kids: string | null
  smoking: string | null
  drinking: string | null
  pets: string | null
  mbti: string | null
  created_at: string
  updated_at: string
}

export interface SupabasePhoto {
  id: string
  user_id: string
  photo_url: string
  position: number
  created_at: string
}

export interface SupabaseLike {
  id: string
  liker_id: string
  liked_id: string
  created_at: string
}

export interface SupabaseMatch {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
}

export interface SupabaseMessage {
  id: string
  match_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
}

/**
 * Get or create a user by email
 */
export async function getOrCreateUser(email: string): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase) return null

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return existingUser.id
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ email }])
      .select('id')
      .single()

    if (error) throw error
    return newUser?.id || null
  } catch (error) {
    console.error('Error getting/creating user:', error)
    return null
  }
}

/**
 * Save or update a user profile
 */
export async function saveProfile(
  userId: string,
  profile: Partial<SupabaseProfile>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert([
        {
          user_id: userId,
          ...profile,
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'user_id' })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving profile:', error)
    return false
  }
}

/**
 * Get a user's profile
 */
export async function getProfile(userId: string): Promise<SupabaseProfile | null> {
  if (!isSupabaseConfigured() || !supabase) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data as SupabaseProfile
  } catch (error) {
    console.error('Error getting profile:', error)
    return null
  }
}

/**
 * Get all profiles (for discovery feed)
 */
export async function getAllProfiles(
  excludeUserId?: string,
  limit: number = 50
): Promise<SupabaseProfile[]> {
  if (!isSupabaseConfigured() || !supabase) return []

  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .limit(limit)

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data as SupabaseProfile[]) || []
  } catch (error) {
    console.error('Error getting profiles:', error)
    return []
  }
}

/**
 * Save photos for a user
 */
export async function savePhotos(
  userId: string,
  photoUrls: string[]
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false

  try {
    // Delete existing photos
    await supabase
      .from('photos')
      .delete()
      .eq('user_id', userId)

    // Insert new photos
    const photos = photoUrls.map((url, index) => ({
      user_id: userId,
      photo_url: url,
      position: index
    }))

    const { error } = await supabase
      .from('photos')
      .insert(photos)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving photos:', error)
    return false
  }
}

/**
 * Get photos for a user
 */
export async function getPhotos(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured() || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('photos')
      .select('photo_url')
      .eq('user_id', userId)
      .order('position', { ascending: true })

    if (error) throw error
    return data?.map(p => p.photo_url) || []
  } catch (error) {
    console.error('Error getting photos:', error)
    return []
  }
}

/**
 * Record a like
 */
export async function recordLike(
  likerId: string,
  likedId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false

  try {
    const { error } = await supabase
      .from('likes')
      .insert([
        {
          liker_id: likerId,
          liked_id: likedId
        }
      ])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error recording like:', error)
    return false
  }
}

/**
 * Check if two users have matched
 */
export async function checkMatch(
  userId1: string,
  userId2: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  } catch (error) {
    console.error('Error checking match:', error)
    return false
  }
}

/**
 * Get the match ID for two users
 * Returns the actual match UUID from the database
 */
export async function getMatchId(
  userId1: string,
  userId2: string
): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase) return null

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id')
      .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data?.id || null
  } catch (error) {
    console.error('Error getting match ID:', error)
    return null
  }
}

/**
 * Get all matches for a user
 */
export async function getMatches(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured() || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

    if (error) throw error
    
    // Return the IDs of matched users (not the current user)
    return data?.map(m => 
      m.user1_id === userId ? m.user2_id : m.user1_id
    ) || []
  } catch (error) {
    console.error('Error getting matches:', error)
    return []
  }
}

/**
 * Send a message
 */
export async function sendMessage(
  matchId: string,
  senderId: string,
  content: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false

  try {
    const { error } = await supabase
      .from('messages')
      .insert([
        {
          match_id: matchId,
          sender_id: senderId,
          content,
          read: false
        }
      ])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error sending message:', error)
    return false
  }
}

/**
 * Get messages for a match
 */
export async function getMessages(matchId: string): Promise<SupabaseMessage[]> {
  if (!isSupabaseConfigured() || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data as SupabaseMessage[]) || []
  } catch (error) {
    console.error('Error getting messages:', error)
    return []
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  matchId: string,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false

  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('match_id', matchId)
      .neq('sender_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return false
  }
}

/**
 * ADMIN FUNCTIONS
 */

/**
 * Get total user count
 */
export async function getTotalUsers(): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) return 0

  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error getting user count:', error)
    return 0
  }
}

/**
 * Get total match count
 */
export async function getTotalMatches(): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) return 0

  try {
    const { count, error } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error getting match count:', error)
    return 0
  }
}

/**
 * Get total message count
 */
export async function getTotalMessages(): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) return 0

  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error getting message count:', error)
    return 0
  }
}

/**
 * Get all users with their profiles
 */
export async function getAllUsers(limit: number = 50): Promise<any[]> {
  if (!isSupabaseConfigured() || !supabase) return []

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, users!inner(email, created_at)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting users:', error)
    return []
  }
}

/**
 * Block a user
 */
export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false

  try {
    const { error } = await supabase
      .from('blocks')
      .insert([
        {
          blocker_id: blockerId,
          blocked_id: blockedId
        }
      ])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error blocking user:', error)
    return false
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(
  blockerId: string,
  blockedId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false

  try {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error unblocking user:', error)
    return false
  }
}

/**
 * Delete a user and all their data
 */
export async function deleteUser(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false

  try {
    // Delete in order (respecting foreign keys)
    await supabase.from('messages').delete().eq('sender_id', userId)
    await supabase.from('blocks').delete().eq('blocker_id', userId)
    await supabase.from('blocks').delete().eq('blocked_id', userId)
    await supabase.from('reports').delete().eq('reporter_id', userId)
    await supabase.from('reports').delete().eq('reported_id', userId)
    await supabase.from('matches').delete().eq('user1_id', userId)
    await supabase.from('matches').delete().eq('user2_id', userId)
    await supabase.from('likes').delete().eq('liker_id', userId)
    await supabase.from('likes').delete().eq('liked_id', userId)
    await supabase.from('photos').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('user_id', userId)
    
    const { error } = await supabase.from('users').delete().eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    return false
  }
}
