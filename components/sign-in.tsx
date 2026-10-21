"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useGoogleAuth } from "@/lib/google-auth"
import { isGoogleSession } from "@/lib/google-session"
import { loadExternalScript } from "@/lib/load-script"

function Mark() {
  return (
    <svg viewBox="0 0 40 30" className="h-8 w-[2.65rem] text-foreground" aria-hidden="true">
      <defs>
        <clipPath id="partner-sign-ring">
          <circle cx="14.6" cy="15" r="7.4" />
        </clipPath>
      </defs>
      <circle cx="25.4" cy="15" r="7.4" fill="currentColor" opacity="0.22" clipPath="url(#partner-sign-ring)" />
      <circle cx="14.6" cy="15" r="8.6" fill="none" stroke="currentColor" strokeWidth="2.35" />
      <circle cx="25.4" cy="15" r="8.6" fill="none" stroke="currentColor" strokeWidth="2.35" />
    </svg>
  )
}

export function SignIn() {
  const { clientId, signIn } = useGoogleAuth()
  const buttonRef = useRef<HTMLDivElement>(null)
  const adultRef = useRef(false)
  const [adult, setAdult] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId || !buttonRef.current) return
    let cancelled = false
    const host = buttonRef.current
    loadExternalScript("https://accounts.google.com/gsi/client")
      .then(() => {
        const google = (window as Window & { google?: GoogleAccounts }).google
        if (cancelled || !google || !host) return
        host.replaceChildren()
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void accept(response.credential)
          },
          auto_select: false,
          ux_mode: "popup",
        })
        google.accounts.id.renderButton(host, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          logo_alignment: "left",
          width: 320,
          locale: "fi",
        })
      })
      .catch(() => {
        if (!cancelled) setProblem("Google-kirjautumista ei saatu auki. Yritä uudelleen.")
      })
    return () => {
      cancelled = true
    }

    async function accept(credential: string) {
      if (!adultRef.current) {
        setProblem("Vahvista ensin, että olet vähintään 18-vuotias.")
        return
      }
      setProblem(null)
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      }).catch(() => null)
      const session = response?.ok ? await response.json().catch(() => null) : null
      if (!isGoogleSession(session)) {
        setProblem("Google-kirjautuminen ei onnistunut.")
        return
      }
      signIn(session)
    }
  }, [clientId, signIn])

  return (
    <div className="grid h-dvh place-items-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <Mark />
          <span className="font-heading text-[1.7rem] leading-none tracking-[-0.03em]">Partner</span>
        </div>
        <h1 className="mt-8 font-heading text-[2rem] leading-none tracking-[-0.02em]">Kirjaudu sisään</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Partner aukeaa Google-tunnuksella.
        </p>
        {clientId ? (
          <div ref={buttonRef} className="mt-8 flex min-h-11 justify-center" />
        ) : (
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
            Google-asiakastunnusta ei ole vielä liitetty. Voit jatkaa tässä selaimessa, kunnes tunniste on asetettu.
          </p>
        )}
        <label className="mt-6 flex items-start gap-3 text-sm leading-5">
          <input
            type="checkbox"
            checked={adult}
            onChange={(event) => {
              adultRef.current = event.target.checked
              setAdult(event.target.checked)
            }}
            className="mt-0.5 size-4 accent-foreground"
          />
          Olen vähintään 18-vuotias
        </label>
        {!clientId && <PreviewButton adult={adult} />}
        {problem && <p className="mt-4 text-sm text-destructive">{problem}</p>}
        <p className="mt-5 text-sm text-muted-foreground">
          <Link href="/tietosuoja" className="underline underline-offset-4">
            Tietosuoja
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/ehdot" className="underline underline-offset-4">
            Käyttöehdot
          </Link>
        </p>
      </div>
    </div>
  )
}

function PreviewButton({ adult }: { adult: boolean }) {
  const { signInPreview } = useGoogleAuth()
  return (
    <Button
      type="button"
      className="mt-4 h-12 w-full rounded-full text-[15px]"
      disabled={!adult}
      onClick={() => {
        if (!adult) return
        signInPreview()
      }}
    >
      Jatka tässä selaimessa
    </Button>
  )
}

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string
        callback: (response: { credential: string }) => void
        auto_select?: boolean
        ux_mode?: "popup"
      }) => void
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void
    }
  }
}
