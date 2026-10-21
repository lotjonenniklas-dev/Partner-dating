"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Send } from "lucide-react"
import { Portrait } from "@/components/portrait"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useBounded } from "@/components/use-bounded"
import { blockDevice } from "@/lib/directory-client"
import { formatLikeRemaining } from "@/lib/like-ttl"
import { usePartner } from "@/lib/store"

function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    let timer = 0
    const tick = () => {
      setNow(Date.now())
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000))
    return () => window.clearTimeout(timer)
  }, [])
  return now
}

export function SentLikes() {
  const { pending, likeSentAt, block } = usePartner()
  const [blockId, setBlockId] = useState<string | null>(null)
  const now = useNow()
  const sent = useBounded(
    [...pending].sort((a, b) => (likeSentAt[b.id] ?? 0) - (likeSentAt[a.id] ?? 0)),
  )

  return (
    <div>
      <div className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
        {sent.shown.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-card px-6 py-10 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-md border border-border">
              <Send className="size-5" strokeWidth={1.75} />
            </div>
            <h2 className="mt-4 font-heading text-[1.65rem] tracking-[-0.02em]">
              Ei lähetettyjä tykkäyksiä
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Tykkää profiileista Tutustu-sivulla. Tykkäys näkyy tässä vuorokauden.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Siirry tutustumaan
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-2">
            {sent.shown.map((person) => (
              <li
                key={person.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3"
              >
                <span className="size-12 shrink-0 overflow-hidden rounded-md">
                  <Portrait scene={person.scene} className="size-full" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading text-lg tracking-[-0.02em]">
                    {person.name}, {person.age}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {person.city}
                    {typeof likeSentAt[person.id] === "number"
                      ? ` · ${formatLikeRemaining(likeSentAt[person.id], now)}`
                      : ""}
                  </span>
                </span>
                <button
                  type="button"
                  className="shrink-0 text-sm text-muted-foreground"
                  onClick={() => setBlockId(person.id)}
                >
                  Estä
                </button>
              </li>
            ))}
          </ul>
        )}
        <Dialog open={blockId !== null} onOpenChange={(open) => !open && setBlockId(null)}>
          <DialogContent className="sm:max-w-sm" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl tracking-[-0.02em]">
                Haluatko varmasti estää henkilön?
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Button
                type="button"
                className="h-12 flex-1 rounded-full"
                onClick={() => {
                  if (!blockId) return
                  if (blockId.startsWith("dev_")) void blockDevice(blockId)
                  block(blockId)
                  setBlockId(null)
                }}
              >
                Kyllä
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 rounded-full"
                onClick={() => setBlockId(null)}
              >
                En
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {sent.hidden > 0 && (
          <button type="button" onClick={sent.more} className="mt-3 text-sm text-muted-foreground">
            Näytä lisää
          </button>
        )}
      </div>
    </div>
  )
}
