export function loadExternalScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing?.dataset.ready === "1") {
      resolve()
      return
    }
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error(src)), { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.ready = "1"
      resolve()
    }
    script.onerror = () => {
      script.remove()
      reject(new Error(src))
    }
    document.head.appendChild(script)
  })
}
