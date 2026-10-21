"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/theme"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (effectiveTheme === "light") {
      setTheme("dark")
    } else {
      setTheme("light")
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-full"
      aria-label={effectiveTheme === "light" ? "Vaihda tummaan tilaan" : "Vaihda kirkaaseen tilaan"}
    >
      {effectiveTheme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  )
}

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Teema</p>
      <div className="flex gap-2">
        <button
          onClick={() => setTheme("light")}
          className={`flex-1 rounded-lg border px-4 py-2 text-sm transition-colors ${
            theme === "light"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-accent"
          }`}
        >
          ☀️ Kirkas
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`flex-1 rounded-lg border px-4 py-2 text-sm transition-colors ${
            theme === "dark"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-accent"
          }`}
        >
          🌙 Tumma
        </button>
        <button
          onClick={() => setTheme("system")}
          className={`flex-1 rounded-lg border px-4 py-2 text-sm transition-colors ${
            theme === "system"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-accent"
          }`}
        >
          💻 Järjestelmä
        </button>
      </div>
    </div>
  )
}
