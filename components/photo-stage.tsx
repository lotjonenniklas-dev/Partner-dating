"use client"

import { useState, type ReactNode } from "react"
import { Portrait } from "@/components/portrait"
import { personFrames, type Person } from "@/lib/people"
import { cn } from "cn"

export function PhotoStage({
  person,
  caption,
  controls = true,
}: {
  person: Person
  caption?: ReactNode
  controls?: boolean
}) {
  const frames = personFrames(person)
  const [state, setState] = useState({ id: person.id, index: 0 })
  const index = state.id === person.id ? Math.min(state.index, frames.length - 1) : 0

  function show(next: number) {
    const count = frames.length
    setState({ id: person.id, index: (next + count) % count })
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (frames.length < 2) return
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    event.stopPropagation()
    show(index + (event.key === "ArrowRight" ? 1 : -1))
  }

  return (
    <div
      data-photos
      tabIndex={frames.length > 1 ? 0 : undefined}
      onKeyDown={onKeyDown}
      className="absolute inset-0 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
    >
      <Portrait scene={frames[index]} className="absolute inset-0 size-full" />
      {index === 0 && caption ? (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[rgba(12,20,34,0.92)] via-[rgba(12,20,34,0.5)] to-transparent px-4 pt-16 pb-4 text-white">
          {caption}
        </div>
      ) : null}
      {controls && frames.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Edellinen kuva"
            className="absolute inset-y-0 left-0 z-10 w-1/3 touch-pan-y"
            onClick={() => show(index - 1)}
          />
          <button
            type="button"
            aria-label="Seuraava kuva"
            className="absolute inset-y-0 right-0 z-10 w-1/3 touch-pan-y"
            onClick={() => show(index + 1)}
          />
          <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full bg-foreground/45 px-2.5 py-1.5">
              {frames.map((frame, frameIndex) => (
                <span
                  key={`${frame.sky}-${frame.prop}-${frameIndex}`}
                  className={cn(
                    "h-1 rounded-full bg-white",
                    frameIndex === index ? "w-5" : "w-1.5 opacity-55",
                  )}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
