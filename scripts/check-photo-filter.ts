import {
  EXPLICIT_PHOTO_MESSAGE,
  explicitPhotoMessage,
  type NsfwScore,
} from "../lib/photo-filter.ts"

function scores(partial: Record<string, number>): NsfwScore[] {
  return Object.entries(partial).map(([className, probability]) => ({
    className,
    probability,
  }))
}

function assertAllowed(partial: Record<string, number>) {
  const message = explicitPhotoMessage(scores(partial))
  if (message !== null) {
    throw new Error(`expected allow ${JSON.stringify(partial)} but got ${message}`)
  }
}

function assertBlocked(partial: Record<string, number>) {
  const message = explicitPhotoMessage(scores(partial))
  if (message !== EXPLICIT_PHOTO_MESSAGE) {
    throw new Error(`expected block ${JSON.stringify(partial)} but got ${message}`)
  }
}

assertAllowed({ Neutral: 0.99, Sexy: 0.01 })
assertAllowed({ Drawing: 0.92, Neutral: 0.08 })
assertAllowed({ Sexy: 0.7, Porn: 0.05, Neutral: 0.25 })
assertAllowed({ Sexy: 0.84, Porn: 0.19, Neutral: 0.1 })
assertAllowed({ Porn: 0.34, Hentai: 0.44, Sexy: 0.2 })
assertAllowed({})

assertBlocked({ Porn: 0.35 })
assertBlocked({ porn: 0.9, Neutral: 0.1 })
assertBlocked({ Hentai: 0.45 })
assertBlocked({ Sexy: 0.85, Neutral: 0.15 })
assertBlocked({ Sexy: 0.55, Porn: 0.2 })
assertBlocked({ Sexy: 0.99 })

console.log("photo filter policy ok")
