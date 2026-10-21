"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PhotoViewer } from "@/components/photo-viewer"
import { Portrait } from "@/components/portrait"
import { blockDevice, deviceId } from "@/lib/directory-client"
import { fetchMessages, sendMessage as sendMessageAPI } from "@/lib/chat-client"
import { personFrames } from "@/lib/people"
import { findCachedPerson } from "@/lib/profile-cache"
import { rememberReport, reportReasons, type ReportReason } from "@/lib/report"
import { validateMessage } from "@/lib/message-filter"
import { usePartner, type ChatMessage } from "@/lib/store"
import { useSupabaseChat } from "@/hooks/use-supabase-chat"
import { cn } from "cn"

function mergeMessages(local: ChatMessage[], supabase: ChatMessage[]): ChatMessage[] {
  // Combine and deduplicate by ID, sort by timestamp
  const seen = new Set<string>()
  const all: ChatMessage[] = []
  
  for (const msg of [...local, ...supabase]) {
    if (!seen.has(msg.id)) {
      seen.add(msg.id)
      all.push(msg)
    }
  }
  
  // Sort by timestamp
  all.sort((a, b) => a.at - b.at)
  
  return all
}

export function Conversation({ personId }: { personId: string }) {
  const { matches, messagesFor, send: sendLocal, typingId, block, blocked, returnToDeck, me } = usePartner()
  const router = useRouter()
  const person = findCachedPerson(personId)
  const isLiveChat = personId.startsWith("dev_")
  const allowed = Boolean(person && (matches.some((match) => match.id === personId) || isLiveChat))
  const localMessages = messagesFor(personId)
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([])
  
  // Load messages from Supabase
  const { supabaseMessages, isMatch } = useSupabaseChat(personId, !isLiveChat)
  
  // Merge localStorage + Supabase messages
  const mergedMessages = isLiveChat ? liveMessages : mergeMessages(localMessages, supabaseMessages)
  const messages = mergedMessages
  const [draft, setDraft] = useState("")
  const [photoAt, setPhotoAt] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [reportDone, setReportDone] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const hidden = blocked.includes(personId)

  useEffect(() => {
    if (!hidden) return
    router.replace("/matches")
  }, [hidden, router])

  useEffect(() => {
    if (isLiveChat) {
      let myDevice = ""
      try {
        myDevice = deviceId()
      } catch {
        return
      }
      fetchMessages(myDevice, personId).then(setLiveMessages)
      const interval = setInterval(() => {
        fetchMessages(myDevice, personId).then(setLiveMessages)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [personId, isLiveChat])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length, typingId])

  useEffect(() => {
    if (!menuOpen) return
    function onPointer(event: PointerEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest("[data-chat-menu]")) return
      setMenuOpen(false)
    }
    window.addEventListener("pointerdown", onPointer)
    return () => window.removeEventListener("pointerdown", onPointer)
  }, [menuOpen])

  if (hidden) return null

  if (!person || (!allowed && !leaving)) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="font-heading text-[1.75rem] tracking-[-0.02em]">
            Keskustelua ei löydy
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Viestejä voi lähettää vain osumille. Tämä profiili ei ole molemminpuolinen
            tykkäys, tai osoite on väärä.
          </p>
          <Link
            href="/matches"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Takaisin osumiin
          </Link>
        </div>
      </div>
    )
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const message = draft.trim()
    if (!message) return
    
    // Validate message before sending
    const validation = validateMessage(message)
    if (!validation.valid) {
      alert(validation.error)
      return
    }
    
    setDraft("")
    
    if (isLiveChat) {
      let myDevice = ""
      try {
        myDevice = deviceId()
      } catch {
        return
      }
      const sent = await sendMessageAPI(myDevice, personId, message, me.name)
      if (sent) {
        const updated = await fetchMessages(myDevice, personId)
        setLiveMessages(updated)
      }
    } else {
      sendLocal(personId, message)
    }
  }

  const frames = personFrames(person)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-3 py-3">
        <Link
          href="/matches"
          className="grid size-11 place-items-center rounded-full hover:bg-muted"
          aria-label="Takaisin osumiin"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <button
          type="button"
          onClick={() => setPhotoAt(0)}
          className="size-10 shrink-0 overflow-hidden rounded-md"
          aria-label={`Avaa kuvat, ${person.name}`}
        >
          <Portrait scene={person.scene} className="size-full" />
        </button>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-heading text-lg leading-none tracking-[-0.02em]">
            {person.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {person.city} · {typingId === person.id ? "kirjoittaa…" : "osuma"}
          </span>
        </span>
        <div data-chat-menu className="relative flex shrink-0 flex-col items-end">
          <button
            type="button"
            aria-label="Keskustelun valikko"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-11 place-items-center rounded-full hover:bg-muted"
          >
            <MoreHorizontal className="size-5" strokeWidth={1.75} />
          </button>
          {menuOpen && (
            <div className="absolute top-12 right-0 z-30 flex flex-col items-stretch gap-2">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmRemove(true)
                }}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-sm whitespace-nowrap shadow-sm"
                aria-label="Poista ja palauta kortti pinoon"
              >
                Poista
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setConfirmBlock(true)
                }}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-sm whitespace-nowrap shadow-sm"
              >
                Estä henkilö
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setReason(null)
                  setReportDone(false)
                  setReportError(null)
                  setReportOpen(true)
                }}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-sm whitespace-nowrap shadow-sm"
              >
                Ilmoita henkilö
              </button>
            </div>
          )}
        </div>
      </header>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-[-0.02em]">
              Haluatko varmasti poistaa henkilön?
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              type="button"
              className="h-12 flex-1 rounded-full"
              onClick={() => {
                setConfirmRemove(false)
                setLeaving(true)
                returnToDeck(personId)
                router.push("/")
              }}
            >
              Kyllä
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-full"
              onClick={() => setConfirmRemove(false)}
            >
              En
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open)
          if (!open) {
            setReason(null)
            setReportDone(false)
            setReportError(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-[-0.02em]">
              {reportDone ? "Ilmoitus tallennettiin" : "Ilmoita henkilö"}
            </DialogTitle>
          </DialogHeader>
          {reportDone ? (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ilmoitus pysyy tässä puhelimessa. Yhteistä tiliä ei ole, joten se ei siirry toiselle ihmiselle.
              </p>
              <Button type="button" className="h-12 w-full rounded-full" onClick={() => setReportOpen(false)}>
                Sulje
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {reportReasons.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReason(item.id)}
                    className={cn(
                      "h-11 rounded-full border px-3 text-sm",
                      reason === item.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {reportError ? <p className="text-sm text-destructive">{reportError}</p> : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-full"
                  disabled={!reason}
                  onClick={() => {
                    if (!reason) return
                    const entry = { personId, reason, at: Date.now() }
                    let saved = false
                    try {
                      rememberReport(entry)
                      saved = true
                    } catch {
                      saved = false
                    }
                    void fetch("/api/reports", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(entry),
                    })
                      .then((response) => {
                        if (saved || response.ok) {
                          setReportDone(true)
                          return
                        }
                        setReportError("Ilmoitusta ei voitu tallentaa.")
                      })
                      .catch(() => {
                        if (saved) setReportDone(true)
                        else setReportError("Ilmoitusta ei voitu tallentaa.")
                      })
                  }}
                >
                  Lähetä
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-full"
                  onClick={() => setReportOpen(false)}
                >
                  Peruuta
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                if (personId.startsWith("dev_")) void blockDevice(personId)
                block(personId)
                router.replace("/matches")
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

      {photoAt !== null && (
        <PhotoViewer
          name={person.name}
          frames={frames}
          start={photoAt}
          onClose={() => setPhotoAt(null)}
        />
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain px-4 py-4">
        {messages.length === 0 && (
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Keskustelu on tyhjä. Kirjoita ensimmäinen viesti.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.from === "me"
                  ? "bg-foreground text-background"
                  : "border border-border bg-card"
              }`}
            >
              {message.text}
            </p>
          </div>
        ))}
        {typingId === person.id && (
          <p className="w-fit rounded-2xl border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground">
            Kirjoittaa…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex shrink-0 items-center gap-2 border-t border-border bg-background px-3 py-3"
      >
        <label className="sr-only" htmlFor="message">
          Viesti
        </label>
        <Input
          id="message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Kirjoita viesti"
          className="h-12 rounded-full bg-card px-4"
          maxLength={400}
          enterKeyHint="send"
          autoComplete="off"
        />
        <Button type="submit" className="h-12 shrink-0 rounded-full px-4" disabled={!draft.trim()}>
          Lähetä
        </Button>
      </form>
    </div>
  )
}
