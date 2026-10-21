export const PHOTO_RULE =
  "Kuvassa ei saa näkyä sukuelimiä eikä naisen alastomia rintoja."

export const EXPLICIT_PHOTO_MESSAGE = `Tätä kuvaa ei voi lisätä. ${PHOTO_RULE}`

export const PHOTO_CHECK_FAILED_MESSAGE =
  "Kuvaa ei voitu tarkistaa, joten sitä ei lisätty. Yritä uudelleen."

export type NsfwScore = {
  className: string
  probability: number
}

function score(predictions: NsfwScore[], name: string) {
  return (
    predictions.find((item) => item.className.toLowerCase() === name)?.probability ?? 0
  )
}

// Porn and Hentai cover exposed genitals. Naked breasts usually score as Sexy,
// sometimes together with Porn. Ordinary portraits stay Neutral.
export function explicitPhotoMessage(predictions: NsfwScore[]) {
  const porn = score(predictions, "porn")
  const hentai = score(predictions, "hentai")
  const sexy = score(predictions, "sexy")
  if (porn >= 0.35 || hentai >= 0.45) return EXPLICIT_PHOTO_MESSAGE
  if (sexy >= 0.85) return EXPLICIT_PHOTO_MESSAGE
  if (sexy >= 0.55 && porn >= 0.2) return EXPLICIT_PHOTO_MESSAGE
  return null
}

type Classifier = {
  classify: (image: HTMLCanvasElement) => Promise<NsfwScore[]>
}

type NsfwJs = {
  load: (modelName: "MobileNetV2") => Promise<Classifier>
}

let modelPromise: Promise<Classifier> | null = null

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-photo-model="${src}"]`,
    )
    if (existing?.dataset.ready === "1") {
      resolve()
      return
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("script")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.dataset.photoModel = src
    script.onload = () => {
      script.dataset.ready = "1"
      resolve()
    }
    script.onerror = () => {
      script.remove()
      reject(new Error("script"))
    }
    document.head.appendChild(script)
  })
}

// Scripts stay out of the app bundle. TensorFlow's package entry is the Node
// build, and the model weights are separate files the classifier reads from
// the page (window.model and window.group1_shard1of1).
function loadModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      await loadScript("/vendor/nsfw-model")
      await loadScript("/vendor/nsfw-weights")
      await loadScript("/vendor/nsfwjs")
      const nsfw = (window as Window & { nsfwjs?: NsfwJs }).nsfwjs
      if (!nsfw) throw new Error("nsfwjs")
      return nsfw.load("MobileNetV2")
    })().catch((error: unknown) => {
      modelPromise = null
      throw error
    })
  }
  return modelPromise
}

function canvasFromImage(image: HTMLImageElement) {
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const scale = Math.min(1, 512 / Math.max(sourceWidth, sourceHeight))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(sourceWidth * scale))
  canvas.height = Math.max(1, Math.round(sourceHeight * scale))
  const context = canvas.getContext("2d")
  if (!context || !Number.isFinite(scale)) throw new Error("canvas")
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas
}

function loadImage(file: Blob) {
  const url = URL.createObjectURL(file)
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("image"))
    }
    image.src = url
  })
}

export function preloadPhotoModel() {
  return loadModel().then(
    () => undefined,
    () => undefined,
  )
}

function canvasForModel(source: HTMLCanvasElement) {
  const edge = Math.max(source.width, source.height)
  if (edge <= 512) return source
  const scale = 512 / edge
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("canvas")
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

async function classifyCanvas(canvas: HTMLCanvasElement) {
  const model = await loadModel()
  return model.classify(canvasForModel(canvas))
}

export async function screenProfileCanvas(canvas: HTMLCanvasElement) {
  try {
    return explicitPhotoMessage(await classifyCanvas(canvas))
  } catch {
    return PHOTO_CHECK_FAILED_MESSAGE
  }
}

export async function screenProfilePhoto(file: Blob) {
  try {
    const image = await loadImage(file)
    return explicitPhotoMessage(await classifyCanvas(canvasFromImage(image)))
  } catch {
    return PHOTO_CHECK_FAILED_MESSAGE
  }
}
