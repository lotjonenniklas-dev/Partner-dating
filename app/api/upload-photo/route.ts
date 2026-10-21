import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload photo to Cloudinary
 * Accepts base64 image data
 * Returns Cloudinary URL
 */
export async function POST(request: NextRequest) {
  try {
    const { imageData, userId } = await request.json()

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary not configured - falling back to base64 storage')
      return NextResponse.json({
        success: true,
        url: imageData, // Fall back to base64 if Cloudinary not configured
        cloudinary: false,
      })
    }

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(imageData, {
      folder: `partner/users/${userId}`,
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      resource_type: 'image',
    })

    console.log(`[Cloudinary] Uploaded photo for user ${userId}: ${uploadResponse.secure_url}`)

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
      cloudinary: true,
      publicId: uploadResponse.public_id,
    })
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error)
    return NextResponse.json(
      {
        error: 'Photo upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Delete photo from Cloudinary
 */
export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID required' }, { status: 400 })
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ success: true, message: 'Cloudinary not configured' })
    }

    await cloudinary.uploader.destroy(publicId)

    console.log(`[Cloudinary] Deleted photo: ${publicId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Cloudinary] Delete failed:', error)
    return NextResponse.json(
      { error: 'Photo delete failed' },
      { status: 500 }
    )
  }
}
