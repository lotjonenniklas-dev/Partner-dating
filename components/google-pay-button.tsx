"use client"

import { useEffect, useRef, useState } from "react"
import {
  googlePayConfig,
  isGooglePayCancel,
  paymentRequest,
  paymentToken,
  readyToPayRequest,
  type GooglePayConfig,
} from "@/lib/google-pay"
import { loadExternalScript } from "@/lib/load-script"

type PaymentsClient = {
  isReadyToPay: (request: object) => Promise<{ result: boolean }>
  createButton: (options: {
    onClick: () => void
    buttonColor: "black"
    buttonType: "pay"
    buttonLocale: "fi"
    buttonSizeMode: "fill"
  }) => HTMLElement
  loadPaymentData: (request: object) => Promise<unknown>
}

export function GooglePayButton({ onPaid }: { onPaid: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "error">("loading")
  const paying = useRef(false)

  useEffect(() => {
    let cancelled = false
    const config = googlePayConfig()
    const node = host.current

    async function pay(client: PaymentsClient) {
      if (paying.current) return
      paying.current = true
      try {
        const result = await client.loadPaymentData(paymentRequest(config))
        const token = paymentToken(result)
        if (!token) throw new Error("token")
        const response = await fetch("/api/pay/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        if (!response.ok) throw new Error("pay")
        onPaid()
      } catch (error) {
        if (!isGooglePayCancel(error)) setState("error")
      } finally {
        paying.current = false
      }
    }

    loadExternalScript("https://pay.google.com/gp/p/js/pay.js")
      .then(async () => {
        const google = (window as Window & { google?: { payments?: { api?: { PaymentsClient?: new (options: { environment: GooglePayConfig["environment"] }) => PaymentsClient } } } }).google
        const PaymentsClientCtor = google?.payments?.api?.PaymentsClient
        if (cancelled || !node || !PaymentsClientCtor) {
          setState("unavailable")
          return
        }
        const client = new PaymentsClientCtor({ environment: config.environment })
        const ready = await client.isReadyToPay(readyToPayRequest(config))
        if (cancelled) return
        if (!ready.result) {
          setState("unavailable")
          return
        }
        node.replaceChildren()
        node.appendChild(
          client.createButton({
            onClick: () => {
              void pay(client)
            },
            buttonColor: "black",
            buttonType: "pay",
            buttonLocale: "fi",
            buttonSizeMode: "fill",
          }),
        )
        setState("ready")
      })
      .catch(() => {
        if (!cancelled) setState("unavailable")
      })

    return () => {
      cancelled = true
    }
  }, [onPaid])

  return (
    <div className="mt-6">
      <div ref={host} className="h-12 w-full" />
      {state === "unavailable" && (
        <p className="text-sm text-muted-foreground">Google Pay ei ole käytettävissä tässä selaimessa.</p>
      )}
      {state === "error" && (
        <p className="mt-3 text-sm text-destructive">Maksu ei valmistunut. Tykkäyksiä ei avattu.</p>
      )}
    </div>
  )
}
