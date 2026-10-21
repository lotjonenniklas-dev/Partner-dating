"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Monogram, Portrait } from "@/components/portrait"
import type { Scene } from "@/lib/people"
import { cn } from "cn"

export function PhotoViewer({
  name,
  frames = [],
  photos,
  monogram,
  start,
  onClose,
}: {
  name: string
  frames?: Scene[]
  photos?: string[]
  monogram?: string
  start: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(start)
  const [shift, setShift] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{
    pointerId: number
    x: number
    y: number
    dx: number
    locked: boolean
  } | null>(null)
  const sources = photos && photos.length > 0 ? photos : null
  const letter = !sources && frames.length === 0 ? monogram : undefined
  const count = sources ? sources.length : frames.length > 0 ? frames.length : letter ? 1 : 0
  const safe = count === 0 ? 0 : ((index % count) + count) % count
  const frame = !sources && frames.length > 0 ? frames[safe] : undefined
  const photo = sources ? sources[safe] : undefined

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (count < 2) return
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault()
        event.stopPropagation()
        setIndex((value) => value + (event.key === "ArrowRight" ? 1 : -1))
      }
    }
    window.addEventListener("keydown", onKey, true)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey, true)
      document.body.style.overflow = previous
    }
  }, [count, onClose])

  function onPhotoPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || count < 2) return
    const target = event.target as HTMLElement | null
    if (target?.closest("button")) return
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dx: 0,
      locked: false,
    }
  }

  function onPhotoPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start || start.pointerId !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.locked) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      if (Math.abs(dy) >= Math.abs(dx)) {
        drag.current = null
        setShift(0)
        setDragging(false)
        return
      }
      start.locked = true
      setDragging(true)
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* The photo still follows the finger if capture is unavailable. */
      }
    }
    start.dx = dx
    setShift(dx)
  }

  function finishPhotoSwipe(event: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    drag.current = null
    setShift(0)
    setDragging(false)
    if (!start || start.pointerId !== event.pointerId || !start.locked) return
    if (start.dx <= -48) setIndex((value) => value + 1)
    else if (start.dx >= 48) setIndex((value) => value - 1)
  }

  if ((!frame && !photo && !letter) || typeof document === "undefined") return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name}, kuva ${safe + 1} / ${count}`}
      className="fixed inset-0 z-[80] flex flex-col bg-white"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div className="min-w-0">
          <p className="truncate font-heading text-2xl tracking-[-0.02em]">{name}</p>
          <p className="text-sm text-muted-foreground">
            Kuva {safe + 1} / {count}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card"
          aria-label="Sulje"
          autoFocus
        >
          <X className="size-4" />
        </button>
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center px-3"
        onPointerDown={onPhotoPointerDown}
        onPointerMove={onPhotoPointerMove}
        onPointerUp={finishPhotoSwipe}
        onPointerCancel={finishPhotoSwipe}
      >
        <div
          className="relative"
          style={{
            transform: shift === 0 ? undefined : `translateX(${shift}px)`,
            transition: dragging ? undefined : "transform 180ms ease",
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              className="max-h-[min(72dvh,760px)] max-w-[92vw] rounded-2xl object-contain"
            />
          ) : (
            <div
              className="overflow-hidden rounded-2xl"
              style={{
                height: "min(72dvh, 760px)",
                width: "min(92vw, calc(min(72dvh, 760px) * 400 / 520))",
              }}
            >
              {frame ? (
                <Portrait scene={frame} className="size-full" />
              ) : (
                <Monogram name={letter ?? name} className="size-full text-[10rem]" />
              )}
            </div>
          )}
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Edellinen kuva"
                onClick={() => setIndex((value) => value - 1)}
                className="absolute top-1/2 left-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/55"
              >
                <ChevronLeft className="size-5 drop-shadow-[0_1px_2px_rgba(15,23,42,0.85)]" strokeWidth={2.25} />
              </button>
              <button
                type="button"
                aria-label="Seuraava kuva"
                onClick={() => setIndex((value) => value + 1)}
                className="absolute top-1/2 right-2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/55"
              >
                <ChevronRight className="size-5 drop-shadow-[0_1px_2px_rgba(15,23,42,0.85)]" strokeWidth={2.25} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {Array.from({ length: count }, (_, frameIndex) => (
          <button
            key={frameIndex}
            type="button"
            aria-label={`Kuva ${frameIndex + 1}`}
            aria-current={frameIndex === safe}
            onClick={() => setIndex(frameIndex)}
            className="grid size-11 place-items-center"
          >
            <span
              className={cn(
                "h-1.5 rounded-full bg-foreground",
                frameIndex === safe ? "w-6" : "w-1.5 opacity-30",
              )}
            />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}
