"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { Portrait } from "@/components/portrait"
import { useBounded } from "@/components/use-bounded"
import { usePartner } from "@/lib/store"
import { useSupabaseMatches } from "@/hooks/use-supabase-matches"

function previewTime(at: number) {
  return new Intl.DateTimeFormat("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(at)
}

export function Matches() {
  const { matches: localMatches, messagesFor } = usePartner()
  const { supabaseMatches } = useSupabaseMatches()
  
  // Merge localStorage matches with Supabase matches
  const allMatches = [...localMatches]
  const localIds = new Set(localMatches.map(m => m.id))
  for (const match of supabaseMatches) {
    if (!localIds.has(match.id)) {
      allMatches.push(match)
    }
  }
  
  const matches = allMatches
  const started = (id: string) => messagesFor(id).some((message) => message.from === "me")
  const opened = matches
    .filter((person) => started(person.id))
    .sort((a, b) => {
      const latest = (id: string) => messagesFor(id).at(-1)?.at ?? 0
      return latest(b.id) - latest(a.id)
    })
  const fresh = matches.filter((person) => !started(person.id))
  const freshWindow = useBounded(fresh)
  const openedWindow = useBounded(opened)

  return (
    <div>
      <div className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
        <h1 className="font-heading text-[2rem] leading-none tracking-[-0.02em]">Osumat</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keskustelu aukeaa, kun tykkäys on molemminpuolinen.
        </p>

        {matches.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-card px-6 py-10 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-md border border-border">
              <Heart className="size-5" strokeWidth={1.75} />
            </div>
            <h2 className="mt-4 font-heading text-[1.65rem] tracking-[-0.02em]">Ei osumia vielä</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Tykkää profiileista Tutustu-sivulla. Jos toinen on jo tykännyt sinusta,
              osuma syntyy heti.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Siirry tutustumaan
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {fresh.length > 0 && (
              <section>
                <div className="-mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {freshWindow.shown.map((person) => (
                    <Link
                      key={person.id}
                      href={`/chat/${person.id}`}
                      className="w-[4.75rem] shrink-0"
                    >
                      <span className="block aspect-[3/4] overflow-hidden rounded-xl border border-border">
                        <Portrait scene={person.scene} className="size-full" />
                      </span>
                      <span className="mt-1.5 block truncate text-center text-sm">{person.name}</span>
                    </Link>
                  ))}
                  {freshWindow.hidden > 0 && (
                    <button
                      type="button"
                      onClick={freshWindow.more}
                      className="w-[4.75rem] shrink-0 self-center text-sm text-muted-foreground"
                    >
                      Näytä lisää
                    </button>
                  )}
                </div>
              </section>
            )}

            {opened.length > 0 && (
            <section>
              <h2 className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                Keskustelut
              </h2>
              <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {openedWindow.shown.map((person) => {
                    const thread = messagesFor(person.id)
                    const last = thread[thread.length - 1]
                    return (
                      <li key={person.id}>
                        <Link
                          href={`/chat/${person.id}`}
                          className="flex items-center gap-3 px-3 py-3 hover:bg-muted/70"
                        >
                          <span className="size-12 shrink-0 overflow-hidden rounded-md">
                            <Portrait scene={person.scene} className="size-full" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="font-heading text-lg tracking-[-0.02em]">
                                {person.name}
                              </span>
                              {last && (
                                <span className="text-xs text-muted-foreground">
                                  {previewTime(last.at)}
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                              {last
                                ? `${last.from === "me" ? "Sinä: " : ""}${last.text}`
                                : `${person.city} · aloita keskustelu`}
                            </span>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              {openedWindow.hidden > 0 && (
                <button
                  type="button"
                  onClick={openedWindow.more}
                  className="mt-3 text-sm text-muted-foreground"
                >
                  Näytä lisää
                </button>
              )}
            </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
