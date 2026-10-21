/**
 * AI-powered image moderation using Google Cloud Vision API
 */

type ModerationResult = {
  approved: boolean
  reason?: string
  details?: {
    adult: string
    violence: string
    faces: number
    spoof: string
    medical: string
    racy: string
  }
}

/**
 * Check if an image is appropriate for a dating app profile
 */
export async function moderateImage(imageData: string): Promise<ModerationResult> {
  try {
    // Call the moderation API
    const response = await fetch('/api/moderate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData }),
    })

    if (!response.ok) {
      throw new Error('Moderation API failed')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Image moderation error:', error)
    // Fail open - allow image if moderation fails (but log it)
    // In production, you might want to fail closed (reject if moderation fails)
    return {
      approved: true,
      reason: 'Moderation service unavailable',
    }
  }
}

/**
 * Client-side basic checks before uploading
 */
export function basicImageChecks(file: File): { valid: boolean; error?: string } {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Kuva on liian suuri (max 5MB)' }
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Tiedoston täytyy olla kuva' }
  }

  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: 'Tuetut muodot: JPG, PNG, WebP' }
  }

  return { valid: true }
}

/**
 * Convert image file to base64
 */
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
