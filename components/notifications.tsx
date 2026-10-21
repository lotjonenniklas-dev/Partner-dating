"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { enableNotifications, notificationSupport, scheduleTestNotice } from "@/lib/notifications"

type Status = "unknown" | "default" | "granted" | "denied" | "ios" | "unsupported"

function readStatus(): Status {
  const support = notificationSupport()
  if (support === "ios") return "ios"
  if (support !== "ok") return "unsupported"
  if (Notification.permission === "denied") return "denied"
  if (Notification.permission === "granted" && localStorage.getItem("partner-push")) return "granted"
  return "default"
}

export function PushProbe() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void scheduleTestNotice()
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [])
  return null
}

export function NotificationsBanner() {
  const [status, setStatus] = useState<Status>("unknown")
  const [hidden, setHidden] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = readStatus()
      setStatus(next)
      setHidden(next !== "default" && next !== "ios")
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  if (hidden || (status !== "default" && status !== "ios")) return null

  return (
    <div className="border-b border-border bg-card px-4 py-3">
      <p className="text-sm">
        {status === "ios"
          ? "Avaa Partner kotivalikon kuvakkeesta, niin ilmoitukset osumista ja viesteistä voi sallia."
          : "Haluatko ilmoituksen, kun saat osuman tai viestin?"}
      </p>
      <div className="mt-3 flex gap-2">
        {status === "default" && (
          <Button
            type="button"
            className="h-10 rounded-full px-4"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void enableNotifications()
                .then((result) => {
                  if (result === "granted") setHidden(true)
                  else setStatus(result === "denied" ? "denied" : readStatus())
                })
                .catch(() => setStatus("default"))
                .finally(() => setBusy(false))
            }}
          >
            Salli
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-full px-4"
          onClick={() => setHidden(true)}
        >
          Ei nyt
        </Button>
      </div>
    </div>
  )
}

export function NotificationSettings() {
  const [status, setStatus] = useState<Status>("unknown")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setStatus(readStatus()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  if (status === "unknown" || status === "unsupported") return null

  return (
    <div className="mt-6 rounded-2xl border border-border p-4">
      <h2 className="font-medium">Ilmoitukset</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {status === "granted"
          ? "Ilmoitukset ovat päällä. Uusi osuma ja uusi viesti tulevat ilmoituksena."
          : status === "denied"
            ? "Ilmoitukset on estetty tässä selaimessa. Salli ne puhelimen asetuksista ja avaa Partner uudelleen."
            : status === "ios"
              ? "Avaa Partner kotivalikon kuvakkeesta. Sen jälkeen ilmoitukset voi sallia."
              : "Saat ilmoituksen uudesta osumasta ja viestistä, vaikka Partner olisi taustalla."}
      </p>
      {status === "default" && (
        <Button
          type="button"
          className="mt-3 h-12 rounded-full px-5"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            setError(null)
            void enableNotifications()
              .then((result) => {
                if (result === "granted") setStatus("granted")
                else if (result === "denied") setStatus("denied")
                else setError("Ilmoituksia ei saatu päälle. Yritä uudelleen.")
              })
              .catch(() => setError("Ilmoituksia ei saatu päälle. Yritä uudelleen."))
              .finally(() => setBusy(false))
          }}
        >
          Salli ilmoitukset
        </Button>
      )}
      {error && <p className="mt-2 text-sm text-muted-foreground">{error}</p>}
    </div>
  )
}
