/**
 * Photo upload utility with Cloudinary integration
 * Falls back to base64 if Cloudinary not configured
 */

export type PhotoUploadResult = {
  url: string
  cloudinary: boolean
  publicId?: string
  error?: string
}

/**
 * Upload photo to Cloudinary (or fall back to base64)
 * @param imageDataUrl - Base64 data URL of the image
 * @param userId - User ID for organizing photos
 * @returns Photo URL (Cloudinary or base64)
 */
export async function uploadPhotoToCloud(
  imageDataUrl: string,
  userId: string = 'anonymous'
): Promise<PhotoUploadResult> {
  try {
    console.log('[Photo Upload] Attempting to upload to Cloudinary...')
    
    const response = await fetch('/api/upload-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: imageDataUrl,
        userId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.cloudinary) {
      console.log('[Photo Upload] ✅ Uploaded to Cloudinary:', result.url)
      return {
        url: result.url,
        cloudinary: true,
        publicId: result.publicId,
      }
    } else {
      console.log('[Photo Upload] ⚠️ Cloudinary not configured, using base64')
      return {
        url: imageDataUrl,
        cloudinary: false,
      }
    }
  } catch (error) {
    console.error('[Photo Upload] ❌ Failed:', error)
    // Fallback to base64 on error
    return {
      url: imageDataUrl,
      cloudinary: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Delete photo from Cloudinary
 * @param publicId - Cloudinary public ID
 */
export async function deletePhotoFromCloud(publicId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/upload-photo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    })

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`)
    }

    console.log('[Photo Delete] ✅ Deleted from Cloudinary:', publicId)
    return true
  } catch (error) {
    console.error('[Photo Delete] ❌ Failed:', error)
    return false
  }
}

/**
 * Get user ID from Google session or generate anonymous ID
 */
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'anonymous'
  
  try {
    const sessionJson = localStorage.getItem('GOOGLE_SESSION')
    if (sessionJson) {
      const session = JSON.parse(sessionJson)
      if (session.user?.id) {
        return session.user.id
      }
    }
  } catch (error) {
    console.error('[User ID] Failed to get from session:', error)
  }
  
  // Generate or retrieve anonymous ID
  let anonId = localStorage.getItem('ANON_USER_ID')
  if (!anonId) {
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('ANON_USER_ID', anonId)
  }
  
  return anonId
}
