"use client"

import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { X } from "lucide-react"
import {
  EXPLICIT_PHOTO_MESSAGE,
  preloadPhotoModel,
  screenProfileCanvas,
} from "@/lib/photo-filter"
import { PHOTO_MAX } from "@/lib/profile"
import { moderateImage, imageToBase64 } from "@/lib/image-moderation"
import { uploadPhotoToCloud } from "@/lib/photo-upload"

const MAX_EDGE = 600
const MAX_BYTES = 15 * 1024 * 1024
const MAX_DATA_URL = 40_000
const MAX_BINARY = Math.floor(((MAX_DATA_URL - "data:image/jpeg;base64,".length) * 3) / 4)

export function movePhoto(photos: string[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return photos
  const next = photos.slice()
  const [photo] = next.splice(from, 1)
  next.splice(to, 0, photo)
  return next
}

function drawScaled(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext("2d", { alpha: false })
  if (!context) throw new Error("canvas")
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

async function decodePhoto(file: Blob) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }
    } catch {
      try {
        const bitmap = await createImageBitmap(file)
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          close: () => bitmap.close(),
        }
      } catch {
        /* The file still goes through an Image element below. */
      }
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error("image"))
      element.src = url
    })
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

function blobOf(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("blob"))
      },
      "image/jpeg",
      quality,
    )
  })
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("read"))
    reader.readAsDataURL(blob)
  })
}

async function prepareProfilePhoto(file: File) {
  const decoded = await decodePhoto(file)
  if (!decoded.width || !decoded.height) {
    decoded.close()
    throw new Error("image")
  }
  let canvas: HTMLCanvasElement
  try {
    canvas = drawScaled(decoded.source, decoded.width, decoded.height)
  } finally {
    decoded.close()
  }
  let quality = 0.50
  let blob = await blobOf(canvas, quality)
  while (blob.size > MAX_BINARY && quality > 0.30) {
    quality -= 0.05
    blob = await blobOf(canvas, quality)
  }
  return { dataUrl: await blobToDataUrl(blob), canvas }
}

export function ProfilePhotos({
  photos,
  error,
  onChange,
  onOpen,
}: {
  photos: string[]
  error?: string
  onChange: (photos: string[]) => void
  onOpen: (index: number) => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const ignoreClickUntil = useRef(0)
  const pointerAt = useRef(0)
  const holdTimer = useRef(0)
  const previewRef = useRef<string[] | null>(null)
  const busyRef = useRef(false)
  const mounted = useRef(true)
  const suppressClick = useRef(false)
  const dragging = useRef(false)
  const [preview, setPreview] = useState<string[] | null>(null)
  const [dragAt, setDragAt] = useState<{ origin: number; over: number } | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [hold, setHold] = useState(false)
  const [checking, setChecking] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const list = preview ?? photos ?? []
  const room = PHOTO_MAX - list.length
  const pickerLocked = busy || hold
  const shown = dragAt ? movePhoto(list, dragAt.origin, dragAt.over) : list
  const draggingSrc = dragAt ? list[dragAt.origin] : null

  useEffect(() => {
    mounted.current = true
    const preloadTimer = window.setTimeout(() => void preloadPhotoModel(), 300)
    return () => {
      mounted.current = false
      window.clearTimeout(preloadTimer)
      window.clearTimeout(holdTimer.current)
    }
  }, [])

  function showPreview(next: string[]) {
    previewRef.current = next
    if (mounted.current) setPreview(next.slice())
  }

  function removeAt(index: number) {
    if (dragAt) return
    const acc = previewRef.current
    if (acc) {
      if (index < 0 || index >= acc.length) return
      acc.splice(index, 1)
      showPreview(acc)
      return
    }
    if (index < 0 || index >= list.length) return
    onChange(list.filter((_, photoIndex) => photoIndex !== index))
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files ? [...event.target.files] : []
    event.target.value = ""
    void addFiles(picked)
  }

  async function addFiles(incoming: File[]) {
    if (incoming.length === 0 || busyRef.current) return
    busyRef.current = true
    ignoreClickUntil.current = Date.now() + 600
    const outcome = { failed: 0, explicit: 0 }
    const acc = [...list]
    let save = false
    flushSync(() => {
      setBusy(true)
      setHold(true)
      setProblem(null)
      setNote(null)
    })
    const modelReady = preloadPhotoModel()
    try {
      const roomNow = PHOTO_MAX - acc.length
      if (roomNow <= 0) {
        setNote(`Profiilissa voi olla enintään ${PHOTO_MAX} kuvaa.`)
        return
      }
      if (incoming.length > roomNow) {
        setNote(
          roomNow === 1 ? "Voit lisätä vielä yhden kuvan." : `Valitse enintään ${roomNow} kuvaa.`,
        )
        return
      }
      const files = incoming
      save = true
      showPreview(acc)
      const prepared: { dataUrl: string; canvas: HTMLCanvasElement }[] = []
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        if (mounted.current) setProgress({ done: index + 1, total: files.length })
        if (!file.type.startsWith("image/") && file.type !== "") {
          outcome.failed += 1
          continue
        }
        if (file.size > MAX_BYTES) {
          outcome.failed += 1
          continue
        }
        try {
          const photo = await prepareProfilePhoto(file)
          acc.push(photo.dataUrl)
          prepared.push(photo)
          showPreview(acc)
          await new Promise<void>((resolve) => {
            window.requestAnimationFrame(() => resolve())
          })
        } catch {
          outcome.failed += 1
        }
      }
      if (prepared.length > 0) {
        if (mounted.current) {
          setProgress(null)
          setChecking(true)
        }
        await modelReady
        for (const photo of prepared) {
          // First: local browser-based check
          const verdict = await screenProfileCanvas(photo.canvas)
          if (verdict === EXPLICIT_PHOTO_MESSAGE) {
            outcome.explicit += 1
            const at = acc.indexOf(photo.dataUrl)
            if (at >= 0) {
              acc.splice(at, 1)
              if (previewRef.current === acc) showPreview(acc)
            }
            continue
          }

          // Second: AI-based moderation check (only if API configured)
          try {
            const base64 = photo.dataUrl.split(',')[1]
            const modResult = await moderateImage(base64)
            
            if (!modResult.approved) {
              outcome.explicit += 1
              const at = acc.indexOf(photo.dataUrl)
              if (at >= 0) {
                acc.splice(at, 1)
                if (previewRef.current === acc) showPreview(acc)
              }
              if (modResult.reason) {
                setNote(modResult.reason)
              }
              continue
            }
          } catch (error) {
            console.error("AI moderation error:", error)
            // Continue if moderation fails - don't block upload
          }

          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 0)
          })
        }
      }
    } finally {
      let finalPhotos = acc.slice(0, PHOTO_MAX)
      
      // Upload photos to Cloudinary (if configured)
      if (finalPhotos.length > 0 && save) {
        try {
          const userId = (await import('@/lib/photo-upload')).getCurrentUserId()
          console.log('[Photo Upload] Uploading', finalPhotos.length, 'photos to cloud...')
          
          const uploadPromises = finalPhotos.map(async (photoDataUrl) => {
            const result = await uploadPhotoToCloud(photoDataUrl, userId)
            return result.url
          })
          
          const uploadedUrls = await Promise.all(uploadPromises)
          finalPhotos = uploadedUrls
          
          console.log('[Photo Upload] ✅ All photos uploaded!')
        } catch (error) {
          console.error('[Photo Upload] Failed, using base64 fallback:', error)
          // Continue with base64 URLs on error
        }
      }
      
      previewRef.current = null
      busyRef.current = false
      if (mounted.current) {
        setChecking(false)
        setProgress(null)
        setBusy(false)
        setPreview(null)
        if (outcome.explicit > 0) setProblem(EXPLICIT_PHOTO_MESSAGE)
        else if (outcome.failed > 0) {
          setProblem("Osaa kuvista ei voitu lisätä. Valitse kuva puhelimen galleriasta tai kamerasta.")
        }
        holdTimer.current = window.setTimeout(() => {
          if (mounted.current) setHold(false)
        }, 600)
      }
      if (save) onChange(finalPhotos)
    }
  }

  function slotIndex(clientX: number, count: number) {
    const grid = gridRef.current
    if (!grid || count <= 0) return 0
    const rect = grid.getBoundingClientRect()
    const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0
    const column = (rect.width - gap * (PHOTO_MAX - 1)) / PHOTO_MAX
    const pitch = column + gap
    if (pitch <= 0) return 0
    const raw = Math.floor((clientX - rect.left) / pitch)
    return Math.max(0, Math.min(count - 1, raw))
  }

  function onTilePointerDown(index: number, event: React.PointerEvent<HTMLDivElement>) {
    if (busy || event.button !== 0 || list.length < 2 || dragging.current) return
    const target = event.target as HTMLElement | null
    if (target?.closest("[data-remove-photo]")) return
    suppressClick.current = false
    const pointerId = event.pointerId
    const origin = index
    const startX = event.clientX
    const startY = event.clientY
    const photos = list
    let locked = false
    let over = index
    let done = false

    function finish() {
      if (done) return
      done = true
      dragging.current = false
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      if (locked && over !== origin) onChange(movePhoto(photos, origin, over))
      setDragAt(null)
    }

    function move(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!locked) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (Math.abs(dy) > Math.abs(dx)) {
          finish()
          return
        }
        locked = true
        dragging.current = true
        suppressClick.current = true
        try {
          gridRef.current?.setPointerCapture(pointerId)
        } catch {
          /* The row still follows the finger through the window listener. */
        }
      }
      if (ev.cancelable) ev.preventDefault()
      const next = slotIndex(ev.clientX, photos.length)
      if (next === over) return
      over = next
      setDragAt({ origin, over })
    }

    function up(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return
      finish()
    }

    window.addEventListener("pointermove", move, { passive: false })
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  const status = progress
    ? `Lisätään kuvaa ${progress.done}/${progress.total}`
    : checking
      ? "Tarkistetaan kuvia…"
      : null

  return (
    <fieldset
      className="space-y-2"
      onPointerDownCapture={() => {
        pointerAt.current = Date.now()
      }}
    >
      <legend className="text-sm font-medium">Kuvat</legend>
      <p className="text-xs text-muted-foreground">
        {list.length}/{PHOTO_MAX}. Siirrä kuvaa sormella. Sama järjestys näkyy profiilikortilla. Ensimmäinen on kansikuva.
      </p>
      <div
        ref={gridRef}
        className={`grid grid-cols-6 gap-1.5${dragAt ? " touch-none" : ""}`}
      >
        {shown.map((src, index) => (
          <div
            key={src}
            data-photo-tile
            onPointerDown={(event) => onTilePointerDown(index, event)}
            className={`relative aspect-[3/4] touch-pan-y overflow-hidden rounded-md border border-border bg-muted [-webkit-touch-callout:none]${src === draggingSrc ? " z-20 scale-105 shadow-md ring-2 ring-primary" : ""}`}
          >
            <button
              type="button"
              onClick={(event) => {
                if (
                  event.detail !== 0 &&
                  (Date.now() < ignoreClickUntil.current || Date.now() - pointerAt.current > 1500)
                ) {
                  return
                }
                if (suppressClick.current) {
                  suppressClick.current = false
                  return
                }
                onOpen(index)
              }}
              aria-label={`Avaa kuva ${index + 1}`}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" draggable={false} decoding="async" className="pointer-events-none size-full object-cover" />
            </button>
            <button
              type="button"
              aria-label={`Poista kuva ${index + 1}`}
              data-remove-photo
              onPointerDown={(event) => {
                event.stopPropagation()
                event.preventDefault()
              }}
              onPointerUp={(event) => {
                event.stopPropagation()
                event.preventDefault()
                if (event.button !== 0) return
                removeAt(index)
              }}
              onClick={(event) => {
                if (event.detail !== 0) return
                removeAt(index)
              }}
              className="absolute top-0 right-0 z-10 flex size-11 items-start justify-end"
            >
              <span className="mt-0.5 mr-0.5 grid size-5 place-items-center rounded-full bg-foreground/80 text-background">
                <X className="size-3" strokeWidth={2} />
              </span>
            </button>
          </div>
        ))}
        {Array.from({ length: room }, (_, slot) => (
          <label
            key={`empty-${slot}`}
            className={`relative grid aspect-[3/4] place-items-center overflow-hidden rounded-md border border-dashed border-border bg-card text-lg leading-none text-muted-foreground${pickerLocked ? " opacity-60" : ""}`}
          >
            <span aria-hidden="true">{pickerLocked ? "…" : "+"}</span>
            <input
              type="file"
              accept="image/*"
              multiple={room > 1}
              disabled={pickerLocked}
              aria-label={`Lisää kuva, paikka ${list.length + slot + 1}`}
              className="absolute inset-0 cursor-pointer opacity-0 disabled:pointer-events-none"
              onChange={onPick}
            />
          </label>
        ))}
      </div>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
      {(error || problem) && <p className="text-sm text-destructive">{error || problem}</p>}
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </fieldset>
  )
}
