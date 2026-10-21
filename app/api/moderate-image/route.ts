import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

type SafeSearchAnnotation = {
  adult: string
  spoof: string
  medical: string
  violence: string
  racy: string
}

type FaceAnnotation = {
  detectionConfidence: number
}

/**
 * Moderate an image using Google Cloud Vision API
 * Checks for: adult content, violence, inappropriate content, and faces
 */
export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json()

    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 })
    }

    // Check if Google Cloud Vision API key is configured
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY

    if (!apiKey) {
      console.warn("Google Cloud Vision API key not configured - skipping moderation")
      // Fail open - allow image if API not configured
      // In production, you might want to fail closed
      return NextResponse.json({
        approved: true,
        reason: "Moderation not configured",
      })
    }

    // Call Google Cloud Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageData },
              features: [
                { type: "SAFE_SEARCH_DETECTION", maxResults: 1 },
                { type: "FACE_DETECTION", maxResults: 10 },
              ],
            },
          ],
        }),
      }
    )

    if (!visionResponse.ok) {
      console.error("Vision API error:", await visionResponse.text())
      // Fail open
      return NextResponse.json({
        approved: true,
        reason: "Moderation service error",
      })
    }

    const visionData = await visionResponse.json()
    const annotation = visionData.responses[0]

    // Extract results
    const safeSearch: SafeSearchAnnotation = annotation.safeSearchAnnotation || {}
    const faces: FaceAnnotation[] = annotation.faceAnnotations || []

    // Likelihood levels: UNKNOWN, VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
    const isInappropriate = 
      safeSearch.adult === "LIKELY" ||
      safeSearch.adult === "VERY_LIKELY" ||
      safeSearch.violence === "LIKELY" ||
      safeSearch.violence === "VERY_LIKELY" ||
      safeSearch.racy === "VERY_LIKELY"

    const hasFace = faces.length > 0

    // Determine approval
    let approved = true
    let reason: string | undefined

    if (isInappropriate) {
      approved = false
      if (safeSearch.adult === "LIKELY" || safeSearch.adult === "VERY_LIKELY") {
        reason = "Kuva sisältää sopimatonta sisältöä"
      } else if (safeSearch.violence === "LIKELY" || safeSearch.violence === "VERY_LIKELY") {
        reason = "Kuva sisältää väkivaltaa"
      } else if (safeSearch.racy === "VERY_LIKELY") {
        reason = "Kuva on liian paljastava"
      }
    }

    // Optional: Require face in profile pictures (commented out for now)
    // if (!hasFace) {
    //   approved = false
    //   reason = "Profiilikuvassa tulee näkyä kasvot"
    // }

    return NextResponse.json({
      approved,
      reason,
      details: {
        adult: safeSearch.adult || "UNKNOWN",
        violence: safeSearch.violence || "UNKNOWN",
        faces: faces.length,
        spoof: safeSearch.spoof || "UNKNOWN",
        medical: safeSearch.medical || "UNKNOWN",
        racy: safeSearch.racy || "UNKNOWN",
      },
    })
  } catch (error) {
    console.error("Image moderation error:", error)
    // Fail open
    return NextResponse.json({
      approved: true,
      reason: "Moderation error",
    })
  }
}
