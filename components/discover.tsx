"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, MoreHorizontal, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GooglePayButton } from "@/components/google-pay-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PhotoStage } from "@/components/photo-stage"
import { PhotoViewer } from "@/components/photo-viewer"
import { Portrait } from "@/components/portrait"
import { formatDayPassRemaining } from "@/lib/day-pass"
import { pushNotice } from "@/lib/notifications"
import { personNotes } from "@/lib/person-notes"
import { distanceBetweenProfiles } from "@/lib/distance"
import { compatibility } from "@/lib/match"
import { personFrames, type Person } from "@/lib/people"
import { findCachedPerson } from "@/lib/profile-cache"
import {
  attractionLabel,
  genderLabel,
  sexualityLabel,
} from "@/lib/profile"
import { blockDevice, likeDevice } from "@/lib/directory-client"
import { useLiveCards, useLiveLikes } from "@/components/live-sync"
import { usePartner } from "@/lib/store"

export function Discover() {
  const router = useRouter()
  const { deck, passedCount, filteredCount, me, like, pass, block, blocked, decisions, restorePassed, likesLocked, freeResetAt, unlimitedUntil, unlockDay, confirmLiveMatch } = usePartner()
  const now = useNow(typeof unlimitedUntil === "number" && unlimitedUntil > Date.now())
  const passActive = typeof unlimitedUntil === "number" && unlimitedUntil > now
  const live = useLiveCards(me, blocked, decisions)
  const current = live[0] ?? deck[0]
  const upcoming = live[1] ?? (live.length > 0 ? deck[0] : deck[1])
  const fit = current ? compatibility(current, me) : null
  const [leaving, setLeaving] = useState<"like" | "pass" | null>(null)
  const [blockOpen, setBlockOpen] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [matchId, setMatchId] = useState<string | null>(null)
  const [photoAt, setPhotoAt] = useState<number | null>(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [pendingLiveLikes, setPendingLiveLikes] = useState<Set<string>>(new Set())
  const busy = useRef(false)
  const ignoreClick = useRef(false)
  const drag = useRef<{
    pointerId: number
    x: number
    y: number
    dx: number
    locked: boolean
  } | null>(null)
  const matched = matchId ? findCachedPerson(matchId) : undefined
  const { who: whoLikesMe } = useLiveLikes()

  useEffect(() => {
    for (const id of pendingLiveLikes) {
      if (whoLikesMe.has(id) && decisions[id] === "like" && !matchId) {
        confirmLiveMatch(id)
        setMatchId(id)
        const card = live.find((c) => c.id === id)
        if (card) {
          void pushNotice({
            title: "Uusi osuma",
            body: `${card.name} tykkäsi sinusta takaisin.`,
            url: `/chat/${id}`,
          })
        }
        setPendingLiveLikes((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        break
      }
    }
  }, [pendingLiveLikes, whoLikesMe, decisions, matchId, live, confirmLiveMatch])

  useEffect(() => {
    setBlockOpen(false)
    setProfileOpen(false)
  }, [current?.id])

  useEffect(() => {
    if (!blockOpen) return
    function onPointer(event: PointerEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest("[data-card-menu]")) return
      setBlockOpen(false)
    }
    window.addEventListener("pointerdown", onPointer)
    return () => window.removeEventListener("pointerdown", onPointer)
  }, [blockOpen])

  function blockCurrent() {
    if (!current || busy.current || matchId || likesLocked) return
    busy.current = true
    const person = current
    setBlockOpen(false)
    drag.current = null
    setDragging(false)
    setOffset(0)
    setLeaving("pass")
    window.setTimeout(() => {
      if (person.id.startsWith("dev_")) void blockDevice(person.id)
      block(person.id)
      setLeaving(null)
      busy.current = false
    }, 280)
  }

  useEffect(() => {
    for (const card of live) {
      if (card.likesYou && decisions[card.id] === "like" && !matchId) {
        setMatchId(card.id)
        void pushNotice({
          title: "Uusi osuma",
          body: `${card.name} tykkäsi sinusta takaisin.`,
          url: `/chat/${card.id}`,
        })
        break
      }
    }
  }, [live, decisions, matchId])

  const act = useCallback(
    (direction: "like" | "pass") => {
      if (!current || busy.current || matchId || likesLocked) return
      busy.current = true
      const person = current
      drag.current = null
      setDragging(false)
      setOffset(0)
      setLeaving(direction)
      window.setTimeout(() => {
        try {
          if (direction === "like") {
            const result = like(person.id)
            if (result === "match") {
              setMatchId(person.id)
              void pushNotice({
                title: "Uusi osuma",
                body: `${person.name} tykkäsi sinusta takaisin.`,
                url: `/chat/${person.id}`,
              })
            } else if (person.id.startsWith("dev_")) {
              setPendingLiveLikes((prev) => new Set(prev).add(person.id))
            }
          } else {
            pass(person.id)
          }
        } finally {
          setLeaving(null)
          busy.current = false
        }
      }, 280)
    },
    [current, matchId, likesLocked, like, pass],
  )

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false)
        setBlockOpen(false)
        setMatchId(null)
        return
      }
      const target = event.target as HTMLElement | null
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return
      if (target?.closest("[data-photos]")) return
      if (event.key === "ArrowLeft") act("pass")
      if (event.key === "ArrowRight") act("like")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [act])

  function onCardPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || leaving || matchId) return
    ignoreClick.current = false
    const target = event.target as HTMLElement | null
    if (target?.closest("button, a")) return
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dx: 0,
      locked: false,
    }
  }

  function onCardPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start || start.pointerId !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) >= 10 || Math.abs(dy) >= 10) ignoreClick.current = true
    if (!start.locked) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      if (Math.abs(dy) >= Math.abs(dx)) {
        drag.current = null
        setDragging(false)
        setOffset(0)
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
        return
      }
      start.locked = true
      setDragging(true)
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* Swipe still follows the finger if capture is unavailable. */
      }
    }
    start.dx = dx
    setOffset(dx)
  }

  function onCardPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start || start.pointerId !== event.pointerId) return
    const dx = start.dx
    drag.current = null
    setDragging(false)
    if (start.locked && dx > 72) act("like")
    else if (start.locked && dx < -72) act("pass")
    else setOffset(0)
  }

  function onCardClick(event: React.MouseEvent<HTMLDivElement>) {
    if (ignoreClick.current) {
      ignoreClick.current = false
      return
    }
    const target = event.target as HTMLElement | null
    if (target?.closest("button, a")) return
    if (leaving || matchId) return
    setProfileOpen(true)
  }

  return (
    <div>
      <div
        className={
          likesLocked
            ? "fixed inset-x-0 top-[env(safe-area-inset-top)] bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-center px-4 md:top-0 md:bottom-0 md:left-72"
            : "mx-auto flex h-[calc(100dvh-env(safe-area-inset-top)-4.25rem-env(safe-area-inset-bottom))] w-full max-w-lg flex-col px-4 pt-3 pb-2 md:h-auto md:py-8"
        }
      >
        {!likesLocked && (
          <div className="mb-2 flex shrink-0 items-start justify-between gap-3 md:mb-4">
            <div className="min-w-0">
              <h1 className="font-heading text-[1.45rem] leading-none tracking-[-0.02em] md:text-[2rem]">Tutustu</h1>
              <p className="mt-1 text-sm leading-snug text-muted-foreground md:mt-2">
                {me.distanceKm} km
              </p>
              {passActive && unlimitedUntil != null && (
                <p className="mt-1 text-sm leading-snug text-muted-foreground">
                  {formatDayPassRemaining(unlimitedUntil, now)}
                </p>
              )}
            </div>
            <p className="shrink-0 pt-1 text-sm text-muted-foreground tabular-nums">
              {live.length + deck.length > 0 ? `${live.length + deck.length} jäljellä` : "Ei jäljellä"}
            </p>
          </div>
        )}

        {likesLocked ? (
          <LikeLimit freeResetAt={freeResetAt} onUnlock={unlockDay} />
        ) : current ? (
          <div
            className={`relative flex min-h-0 flex-1 flex-col md:block ${offset !== 0 ? "touch-none" : "touch-pan-y"}`}
            onPointerDown={onCardPointerDown}
            onPointerMove={onCardPointerMove}
            onPointerUp={onCardPointerUp}
            onPointerCancel={onCardPointerUp}
            onClick={onCardClick}
          >
              {upcoming && (
                <div
                  className="absolute inset-x-3 top-2 bottom-0 rounded-2xl border border-border bg-muted"
                  aria-hidden="true"
                />
              )}
              <article
                className={`relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_40px_-28px_rgba(18,28,45,0.45)] select-none md:h-[min(72svh,44rem)] md:flex-none ${
                  dragging ? "" : "transition-transform duration-200"
                } ${
                  leaving === "like"
                    ? "card-like"
                    : leaving === "pass"
                      ? "card-pass"
                      : ""
                }`}
                style={
                  leaving || offset === 0
                    ? undefined
                    : {
                        transform: `translateX(${offset}px) rotate(${Math.max(-6, Math.min(6, offset / 40))}deg)`,
                      }
                }
              >
                <div className="relative min-h-0 w-full flex-1 bg-muted">
                  <PhotoStage
                    person={current}
                    controls={false}
                    caption={
                      <div className="space-y-1.5">
                        <h2 className="font-heading text-[1.7rem] leading-none tracking-[-0.02em] text-white">
                          {current.name}, {current.age}
                        </h2>
                        <p className="text-sm text-white/85">{placeLine(me, current)}</p>
                        <p className="text-sm leading-snug text-white/90">
                          <span className="text-white/70">Yhteensopivuus </span>
                          <span className="tabular-nums">{fit?.score}</span>
                          {fit?.reason ? <span className="text-white/75"> · {fit.reason}</span> : null}
                        </p>
                        <p className="text-sm leading-snug text-white/80">{aboutLine(current)}</p>
                        <p className="text-[15px] leading-snug text-white">{current.bio}</p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {current.interests.map((interest) => (
                            <Badge
                              key={interest}
                              variant="secondary"
                              className="h-6 border-white/20 bg-white/15 px-2.5 text-white"
                            >
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    }
                  />
                  <div data-card-menu className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2">
                    <button
                      type="button"
                      aria-label="Kortin valikko"
                      aria-expanded={blockOpen}
                      onClick={() => setBlockOpen((open) => !open)}
                      className="grid size-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm"
                    >
                      <MoreHorizontal className="size-5" strokeWidth={1.75} />
                    </button>
                    {blockOpen && (
                      <button
                        type="button"
                        onClick={() => {
                          setBlockOpen(false)
                          setConfirmBlock(true)
                        }}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-sm"
                      >
                        Estä henkilö
                      </button>
                    )}
                  </div>
                </div>
              </article>
          </div>
        ) : (
          <EmptyDeck
            passedCount={passedCount}
            filteredOut={filteredCount > 0}
            onRestore={restorePassed}
          />
        )}
        {current && !likesLocked && (
          <div className="mt-2 shrink-0 md:mt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-12 min-h-12 flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full border border-border bg-card text-[15px] font-medium select-none hover:bg-muted disabled:pointer-events-none disabled:opacity-50 md:h-14 md:min-h-14"
                aria-label={`Ohita ${current.name}`}
                disabled={Boolean(leaving)}
                onClick={() => act("pass")}
              >
                <X className="size-4" strokeWidth={1.75} />
                Ohita
              </button>
              <button
                type="button"
                className="inline-flex h-12 min-h-12 flex-1 cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-medium text-primary-foreground select-none hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 md:h-14 md:min-h-14"
                aria-label={`Tykkää henkilöstä ${current.name}`}
                disabled={Boolean(leaving)}
                onClick={() => act("like")}
              >
                <Heart className="size-4" strokeWidth={1.75} />
                Tykkää
              </button>
            </div>
            <p className="mt-1.5 text-center text-xs text-muted-foreground">
              Vedä korttia sivulle.
              <span className="hidden md:inline">
                {" "}
                Nuoli vasemmalle ohittaa, nuoli oikealle tykkää.
              </span>
            </p>
          </div>
        )}
      </div>

      {profileOpen && current && (
        <ProfileSheet
          person={current}
          place={placeLine(me, current)}
          fitScore={fit?.score}
          fitReason={fit?.reason}
          onClose={() => setProfileOpen(false)}
          onLike={() => {
            setProfileOpen(false)
            act("like")
          }}
          onPass={() => {
            setProfileOpen(false)
            act("pass")
          }}
          onBlock={() => {
            setProfileOpen(false)
            setBlockOpen(false)
            setConfirmBlock(true)
          }}
        />
      )}

      <Dialog open={confirmBlock} onOpenChange={setConfirmBlock}>
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
                setConfirmBlock(false)
                blockCurrent()
              }}
            >
              Kyllä
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-full"
              onClick={() => setConfirmBlock(false)}
            >
              En
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(matched)}
        modal={photoAt === null}
        disablePointerDismissal={photoAt !== null}
        onOpenChange={(open) => {
          if (!open) {
            setMatchId(null)
            setPhotoAt(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Osuma
            </p>
            <DialogTitle className="font-heading text-[1.75rem] tracking-[-0.02em]">
              Sinä ja {matched?.name}
            </DialogTitle>
            <DialogDescription>
              Te tykkäsitte toisistanne. {matched?.name} ehti jo jättää viestin.
            </DialogDescription>
          </DialogHeader>
          {matched && (
            <button
              type="button"
              onClick={() => setPhotoAt(0)}
              className="size-16 overflow-hidden rounded-lg border border-border"
              aria-label={`Avaa kuvat, ${matched.name}`}
            >
              <Portrait scene={matched.scene} className="size-full" />
            </button>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              className="h-12 flex-1"
              onClick={() => {
                if (!matched) return
                setMatchId(null)
                router.push(`/chat/${matched.id}`)
              }}
            >
              Avaa keskustelu
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1"
              onClick={() => setMatchId(null)}
            >
              Jatka
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {matched && photoAt !== null && (
        <PhotoViewer
          name={matched.name}
          frames={personFrames(matched)}
          start={photoAt}
          onClose={() => setPhotoAt(null)}
        />
      )}
    </div>
  )
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    let timer = 0
    const tick = () => {
      setNow(Date.now())
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000))
    return () => window.clearTimeout(timer)
  }, [active])
  return now
}

function ProfileSheet({
  person,
  place,
  fitScore,
  fitReason,
  onClose,
  onLike,
  onPass,
  onBlock,
}: {
  person: Person
  place: string
  fitScore?: number
  fitReason?: string
  onClose: () => void
  onLike: () => void
  onPass: () => void
  onBlock: () => void
}) {
  const notes = personNotes(person.id)
  return (
    <div className="fixed inset-x-0 top-[env(safe-area-inset-top)] bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 flex flex-col bg-background md:top-0 md:bottom-0 md:left-72">
      <div className="flex shrink-0 items-center justify-between px-4 py-2">
        <button type="button" onClick={onClose} className="min-h-11 px-1 text-sm">
          Sulje
        </button>
        <p className="text-sm text-muted-foreground">Profiili</p>
        <button type="button" onClick={onBlock} className="min-h-11 px-1 text-sm">
          Estä henkilö
        </button>
      </div>
      <div
        data-profile-scroll
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 pb-6"
      >
        <article className="relative h-[min(52svh,32rem)] overflow-hidden rounded-2xl border border-border bg-muted">
          <PhotoStage
            person={person}
            caption={
              <div>
                <h2 className="font-heading text-[1.7rem] leading-none tracking-[-0.02em] text-white">
                  {person.name}, {person.age}
                </h2>
                <p className="mt-1 text-sm text-white/85">{place}</p>
              </div>
            }
          />
        </article>
        <p className="mt-4 text-[15px] leading-relaxed">{person.bio}</p>
        <p className="mt-3 text-sm leading-snug">
          <span className="text-muted-foreground">Yhteensopivuus </span>
          <span className="tabular-nums">{fitScore}</span>
          {fitReason ? <span className="text-muted-foreground"> · {fitReason}</span> : null}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{aboutLine(person)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {person.interests.map((interest) => (
            <Badge key={interest} variant="secondary" className="h-7 px-3">
              {interest}
            </Badge>
          ))}
        </div>
        <h3 className="mt-8 font-heading text-[1.35rem] leading-none tracking-[-0.02em]">Lisätietoja</h3>
        <div className="mt-4 space-y-5">
          {notes.map((note) => (
            <section key={note.title}>
              <h4 className="text-sm text-muted-foreground">{note.title}</h4>
              <p className="mt-1 text-[15px] leading-relaxed">{note.body}</p>
            </section>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-border px-4 py-3">
        <button
          type="button"
          className="inline-flex h-12 min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card text-[15px] font-medium"
          onClick={onPass}
        >
          <X className="size-4" strokeWidth={1.75} />
          Ohita
        </button>
        <button
          type="button"
          className="inline-flex h-12 min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-medium text-primary-foreground"
          onClick={onLike}
        >
          <Heart className="size-4" strokeWidth={1.75} />
          Tykkää
        </button>
      </div>
    </div>
  )
}

function LikeLimit({ freeResetAt, onUnlock }: { freeResetAt: number | null; onUnlock: () => void }) {
  const now = useNow(Boolean(freeResetAt && freeResetAt > Date.now()))
  const remaining = freeResetAt && freeResetAt > now ? freeResetAt - now : 0
  
  const hours = Math.floor(remaining / (60 * 60 * 1000))
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
  
  return (
    <article className="w-full max-w-lg rounded-2xl border border-border bg-card px-6 py-8 shadow-[0_18px_40px_-28px_rgba(18,28,45,0.45)]">
      <h2 className="font-heading text-[1.85rem] leading-tight tracking-[-0.02em]">
        Ilmaiset tykkäykset käytetty
      </h2>
      {remaining > 0 ? (
        <p className="mt-3 text-[15px] leading-relaxed">
          Saat taas 10 ilmaista tykkäystä {hours > 0 ? `${hours} tunnin ja ` : ''}{minutes} minuutin kuluttua.
        </p>
      ) : (
        <p className="mt-3 text-[15px] leading-relaxed">
          Ilmaiset tykkäykset palautuvat pian.
        </p>
      )}
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">Tai maksa 2,99 € ja saat rajattomat tykkäykset vuorokaudeksi.</p>
        <GooglePayButton onPaid={onUnlock} />
      </div>
    </article>
  )
}

function aboutLine(person: Person) {
  if (person.id.startsWith("dev_")) return "Toisella puhelimella"
  return `${sexualityLabel(person.sexuality)} · ${genderLabel[person.gender]} · Kiinnostunut ${attractionLabel(person.attractedTo).toLowerCase()}`
}

function placeLine(
  from: { city: string; latitude?: number | null; longitude?: number | null },
  to: { city: string; latitude?: number | null; longitude?: number | null },
) {
  const km = distanceBetweenProfiles(from, to)
  const city = to.city
  if (km == null) return city
  if (km === 0) return city
  return `${city} · ${km} km`
}

function EmptyDeck({
  passedCount,
  filteredOut,
  onRestore,
}: {
  passedCount: number
  filteredOut: boolean
  onRestore: () => void
}) {
  return (
    <div className="grid flex-1 place-items-center">
      <div className="max-w-sm rounded-2xl border border-border bg-card px-6 py-8 text-center">
        <h2 className="font-heading text-[1.75rem] leading-tight tracking-[-0.02em] text-balance">
          Rajaukseesi sopivat henkilöt loppuivat
        </h2>
        {filteredOut ? (
          <Button
            type="button"
            className="mt-5 h-10 px-4"
            nativeButton={false}
            render={<Link href="/profile" />}
          >
            Muokkaa rajausta
          </Button>
        ) : passedCount > 0 ? (
          <Button type="button" className="mt-5 h-10 px-4" onClick={onRestore}>
            Palauta ohitetut
          </Button>
        ) : (
          <Button
            type="button"
            className="mt-5 h-10 px-4"
            nativeButton={false}
            render={<Link href="/matches" />}
          >
            Näytä osumat
          </Button>
        )}
      </div>
    </div>
  )
}
