export const PHOTO_RULE =
  "Kuvassa ei saa näkyä sukuelimiä eikä naisen alastomia rintoja."

export const EXPLICIT_PHOTO_MESSAGE = `Tätä kuvaa ei voi lisätä. ${PHOTO_RULE}`

export type NsfwScore = {
  className: string
  probability: number
}

function score(predictions: NsfwScore[], name: string) {
  return (
    predictions.find((item) => item.className.toLowerCase() === name)?.probability ?? 0
  )
}

export function explicitPhotoMessage(predictions: NsfwScore[]) {
  const porn = score(predictions, "porn")
  const hentai = score(predictions, "hentai")
  const sexy = score(predictions, "sexy")
  if (porn >= 0.35 || hentai >= 0.45) return EXPLICIT_PHOTO_MESSAGE
  if (sexy >= 0.85) return EXPLICIT_PHOTO_MESSAGE
  if (sexy >= 0.55 && porn >= 0.2) return EXPLICIT_PHOTO_MESSAGE
  return null
}
