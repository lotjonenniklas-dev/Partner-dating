/**
 * Supabase client for database operations
 * Stores user profiles, photos, matches, messages
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Only create client if properly configured
export const supabase = (supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = () => {
  return supabase !== null
}

/**
 * Database Schema:
 * 
 * users:
 *   - id (uuid, primary key)
 *   - email (text, unique)
 *   - created_at (timestamp)
 * 
 * profiles:
 *   - id (uuid, primary key, foreign key to users)
 *   - name (text)
 *   - age (integer)
 *   - city (text)
 *   - latitude (float)
 *   - longitude (float)
 *   - bio (text)
 *   - interests (text[])
 *   - gender (text)
 *   - attracted_to (text)
 *   - sexuality (text)
 *   - age_min (integer)
 *   - age_max (integer)
 *   - distance_km (integer)
 *   - height_cm (integer)
 *   - updated_at (timestamp)
 * 
 * photos:
 *   - id (uuid, primary key)
 *   - user_id (uuid, foreign key to users)
 *   - url (text) -- Cloudinary URL
 *   - order_index (integer)
 *   - created_at (timestamp)
 * 
 * likes:
 *   - id (uuid, primary key)
 *   - from_user_id (uuid, foreign key to users)
 *   - to_user_id (uuid, foreign key to users)
 *   - created_at (timestamp)
 * 
 * matches:
 *   - id (uuid, primary key)
 *   - user1_id (uuid, foreign key to users)
 *   - user2_id (uuid, foreign key to users)
 *   - created_at (timestamp)
 * 
 * messages:
 *   - id (uuid, primary key)
 *   - match_id (uuid, foreign key to matches)
 *   - from_user_id (uuid, foreign key to users)
 *   - message (text)
 *   - created_at (timestamp)
 */
