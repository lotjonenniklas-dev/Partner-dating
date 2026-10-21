"use client"

import { useEffect } from "react"

export function Installable() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Asennus on valinnainen. Sovellus toimii selaimessa ilman sitä. */
    })
  }, [])

  return null
}
