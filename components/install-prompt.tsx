"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check if already installed
    const isInstalled = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true

    if (isInstalled) return

    // Check if user already dismissed
    const dismissed = localStorage.getItem("install-prompt-dismissed")
    if (dismissed) return

    // Listen for install prompt event (Android Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }
    
    window.addEventListener("beforeinstallprompt", handler)

    // For iOS or browsers without beforeinstallprompt, show after delay
    const timer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        setShowPrompt(true)
      }
    }, 5000) // Show after 5 seconds

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      clearTimeout(timer)
    }
  }, [deferredPrompt])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android Chrome - trigger native install prompt
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
    // For iOS, we can't trigger programmatically, just show instructions
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("install-prompt-dismissed", "true")
  }

  if (!showPrompt) return null

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/.test(navigator.userAgent)

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="relative p-6">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Sulje"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl">❤️</span>
            </div>
            
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Lisää Partner kotinäytölle
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Käytä sovellusta kuin tavallista appia - nopeammin ja helpommin!
              </p>

              {deferredPrompt ? (
                // Android Chrome - can show native prompt
                <button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-pink-600 hover:to-rose-700 transition-all shadow-md"
                >
                  Asenna nyt
                </button>
              ) : (
                // iOS or other browsers - show manual instructions
                <div className="space-y-3">
                  {isIOS && (
                    <div className="text-sm text-gray-700 bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="font-semibold mb-2 flex items-center gap-2">
                        <span>📱</span> iPhone-ohjeet:
                      </p>
                      <ol className="space-y-1 text-xs">
                        <li>1. Paina <strong>Jaa</strong>-painiketta (⬆️)</li>
                        <li>2. Valitse <strong>"Lisää kotinäytölle"</strong></li>
                        <li>3. Paina <strong>"Lisää"</strong></li>
                      </ol>
                    </div>
                  )}
                  
                  {isAndroid && (
                    <div className="text-sm text-gray-700 bg-green-50 rounded-xl p-4 border border-green-100">
                      <p className="font-semibold mb-2 flex items-center gap-2">
                        <span>📱</span> Android-ohjeet:
                      </p>
                      <ol className="space-y-1 text-xs">
                        <li>1. Paina <strong>Menu</strong> (⋮)</li>
                        <li>2. Valitse <strong>"Lisää aloitusnäyttöön"</strong></li>
                        <li>3. Paina <strong>"Lisää"</strong></li>
                      </ol>
                    </div>
                  )}

                  {!isIOS && !isAndroid && (
                    <div className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="font-semibold mb-2">Ohjeet:</p>
                      <p className="text-xs">
                        Avaa selaimen valikko ja valitse "Lisää kotinäytölle" tai "Install app"
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleDismiss}
                    className="w-full text-gray-600 text-sm font-medium py-2"
                  >
                    Ehkä myöhemmin
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
