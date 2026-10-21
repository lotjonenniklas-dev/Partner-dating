import type { Metadata, Viewport } from "next"
import { Instrument_Sans } from "next/font/google"
import { Installable } from "@/components/pwa"
import { Shell } from "@/components/shell"
import { BackgroundLocationTracker } from "@/components/background-location-tracker"
import { ErrorBoundary } from "@/components/error-boundary"
import { ErrorTrackingInit } from "@/components/error-tracking-init"
import { AuthProvider } from "@/components/auth-provider"
import { GoogleAuthProvider } from "@/lib/google-auth"
import { PartnerProvider } from "@/lib/store"
import { ThemeProvider } from "@/lib/theme"
import { NotificationPrompt } from "@/components/notification-prompt"
import { ProfileCacheInit } from "@/components/profile-cache-init"
import { InstallPrompt } from "@/components/install-prompt"
import "./globals.css"

const sans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans-face",
  weight: ["400", "500", "600"],
})

// Use sans font for headings too (serif font causing build issues)
const serif = sans

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
  interactiveWidget: "resizes-content",
}

export const metadata: Metadata = {
  applicationName: "Partner",
  title: {
    default: "Partner",
    template: "%s · Partner",
  },
  description: "Yksinkertainen deittisovellus. Tutustu, tykkää ja juttele osumien kanssa.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Partner",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    google: "notranslate",
    "mobile-web-app-capable": "yes",
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fi"
      translate="no"
      className={`${sans.variable} ${serif.variable} min-h-full`}
    >
      <body className="notranslate min-h-full">
        <noscript>
          <p style={{ margin: "24px", fontFamily: "sans-serif" }}>
            Partner tarvitsee JavaScriptin. Salli se Chromessa ja lataa sivu uudelleen.
          </p>
        </noscript>
        <ErrorBoundary>
          <ThemeProvider>
            <GoogleAuthProvider>
              <AuthProvider>
                <PartnerProvider>
                  <Installable />
                  <InstallPrompt />
                  <BackgroundLocationTracker />
                  <ErrorTrackingInit />
                  <NotificationPrompt />
                  <ProfileCacheInit />
                  <Shell>{children}</Shell>
                </PartnerProvider>
              </AuthProvider>
            </GoogleAuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
