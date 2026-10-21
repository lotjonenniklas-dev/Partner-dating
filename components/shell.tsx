"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, Heart, Send, UserRound, X } from "lucide-react"
import { LiveSync } from "@/components/live-sync"
import { NotificationsBanner, PushProbe } from "@/components/notifications"
import { SignIn } from "@/components/sign-in"
import { useGoogleAuth } from "@/lib/google-auth"
import { usePartner } from "@/lib/store"
import { cn } from "cn"

const links = [
  { href: "/profile", label: "Profiili", short: "Profiili", icon: UserRound },
  { href: "/", label: "Tutustu", short: "Tutustu", icon: Compass },
  { href: "/matches", label: "Osumat", short: "Osumat", icon: Heart },
  { href: "/likes", label: "Lähetetyt tykkäykset", short: "Tykkäykset", icon: Send },
]

function Mark() {
  return (
    <svg viewBox="0 0 40 30" className="h-8 w-[2.65rem] shrink-0 text-foreground" aria-hidden="true">
      <defs>
        <clipPath id="partner-ring">
          <circle cx="14.6" cy="15" r="7.4" />
        </clipPath>
      </defs>
      <circle cx="25.4" cy="15" r="7.4" fill="currentColor" opacity="0.22" clipPath="url(#partner-ring)" />
      <circle cx="14.6" cy="15" r="8.6" fill="none" stroke="currentColor" strokeWidth="2.35" />
      <circle cx="25.4" cy="15" r="8.6" fill="none" stroke="currentColor" strokeWidth="2.35" />
    </svg>
  )
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { ready: authReady, session, signOut } = useGoogleAuth()
  const { matches, pending, notice, dismissNotice } = usePartner()
  const [keyboard, setKeyboard] = useState(false)
  const blurTimer = useRef<number | null>(null)

  useEffect(() => {
    function onFocusIn(event: FocusEvent) {
      const target = event.target as HTMLElement | null
      if (!target?.closest("input, textarea, select")) return
      if (blurTimer.current) window.clearTimeout(blurTimer.current)
      setKeyboard(true)
    }
    function onFocusOut() {
      blurTimer.current = window.setTimeout(() => setKeyboard(false), 80)
    }
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    return () => {
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
      if (blurTimer.current) window.clearTimeout(blurTimer.current)
    }
  }, [])

  const legal = pathname === "/tietosuoja" || pathname === "/ehdot"
  if (legal) {
    return (
      <div className="min-h-dvh bg-background pt-[env(safe-area-inset-top)] text-foreground">
        <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 pt-5">
          <Link href="/" className="font-heading text-xl tracking-[-0.03em]">
            Partner
          </Link>
          <Link href="/" className="text-sm text-muted-foreground">
            Takaisin
          </Link>
        </header>
        {children}
      </div>
    )
  }

  if (!authReady) return null
  if (!session) {
    const source = "anon"
    const mockSession = {
      sub: `anon-${Date.now()}-${Math.random().toString(36).slice(2,11)}`,
      name: "",
      email: null,
      picture: null,
      source: source as "anon",
    }
    if (typeof window !== "undefined") {
      try {
        const existing = localStorage.getItem("partner-google")
        if (!existing) {
          localStorage.setItem("partner-google", JSON.stringify(mockSession))
          window.location.reload()
          return null
        }
      } catch {}
    }
  }

  const chat = pathname.startsWith("/chat")

  return (
    <div
      className={cn(
        "min-h-dvh bg-background pt-[env(safe-area-inset-top)] text-foreground md:flex md:h-dvh md:flex-row md:overflow-hidden md:pt-0",
        chat && "max-md:flex max-md:h-dvh max-md:flex-col max-md:overflow-hidden",
      )}
    >
      <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-border bg-card px-5 py-7 md:flex">
        <Link href="/" aria-label="Partner" className="flex items-center gap-3">
          <Mark />
          <span className="font-heading text-[1.55rem] leading-none tracking-[-0.03em] text-foreground">
            Partner
          </span>
        </Link>
        <p className="mt-4 text-sm leading-5 text-muted-foreground">
          Rauhallinen tapa tutustua. Keskustelu avautuu, kun tykkäys on molemminpuolinen.
        </p>
        <nav className="mt-8 flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  <span className="whitespace-nowrap">{link.label}</span>
                </span>
                {link.href === "/matches" && matches.length > 0 && (
                  <span
                    className={cn(
                      "grid min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-xs tabular-nums",
                      active ? "bg-background/15 text-background" : "bg-foreground text-background",
                    )}
                  >
                    {matches.length}
                  </span>
                )}
                {link.href === "/likes" && pending.length > 0 && (
                  <span
                    className={cn(
                      "grid min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-xs tabular-nums",
                      active ? "bg-background/15 text-background" : "bg-foreground text-background",
                    )}
                  >
                    {pending.length}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        {session && (
          <div className="mt-auto pt-8">
            <p className="truncate text-sm">
              {session.source === "google" ? session.name : "Kirjautuminen tässä selaimessa"}
            </p>
            {session.email ? (
              <p className="truncate text-xs text-muted-foreground">{session.email}</p>
            ) : null}
            <button
              type="button"
              onClick={signOut}
              className="mt-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Kirjaudu ulos
            </button>
          </div>
        )}
      </aside>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          chat && "min-h-0",
          keyboard ? "pb-0" : "pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0",
        )}
      >
        <PushProbe />
        <LiveSync />
        {!chat && pathname !== "/profile" && <NotificationsBanner />}
        {notice && (
          <div className="flex items-start justify-between gap-3 border-b border-border bg-card px-4 py-3 text-sm">
            <p>{notice}</p>
            <button
              type="button"
              onClick={dismissNotice}
              className="rounded-full p-1 hover:bg-background"
              aria-label="Sulje ilmoitus"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div
          className={cn(
            chat
              ? "flex min-h-0 flex-1 flex-col"
              : "md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-y-contain",
          )}
        >
          {children}
        </div>
      </div>

      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 px-2 pt-1 backdrop-blur md:hidden",
          "pb-[max(0.35rem,env(safe-area-inset-bottom))]",
          keyboard && "hidden",
        )}
      >
        {links.map((link) => {
          const Icon = link.icon
          const active = isActive(pathname, link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center gap-1 py-1 text-[11px] tracking-wide",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <span className={cn("h-0.5 w-4 rounded-full", active ? "bg-foreground" : "bg-transparent")} />
              <Icon className="size-5" strokeWidth={1.75} />
              {link.short}
              {link.href === "/matches" && matches.length > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-1.35rem)] grid min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] text-background">
                  {matches.length}
                </span>
              )}
              {link.href === "/likes" && pending.length > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-1.35rem)] grid min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] text-background">
                  {pending.length}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

