"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// ADMIN-SALASANA: Vaihda tämä omaan salasanaasi
// TAI lisää .env.local: NEXT_PUBLIC_ADMIN_PASSWORD=your_secret_password
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "VAIHDA_TÄMÄ_SALASANA"

type Report = {
  personId: string
  reason: string
  at: number
}

type Stats = {
  users: number
  matches: number
  messages: number
}

type User = {
  user_id: string
  name: string
  age: number
  city: string
  users: {
    email: string
    created_at: string
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Stats>({ users: 0, matches: 0, messages: 0 })
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'stats'>('stats')

  useEffect(() => {
    // Tarkista onko jo kirjautunut (sessio)
    const isAuth = sessionStorage.getItem("admin-auth") === "true"
    if (isAuth) {
      setAuthenticated(true)
      loadAll()
    }
  }, [])

  async function loadAll() {
    await Promise.all([loadReports(), loadStats(), loadUsers()])
  }

  async function loadReports() {
    try {
      const response = await fetch("/api/admin/reports")
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch {
      console.error("Ei voitu ladata raportteja")
    }
  }

  async function loadStats() {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch {
      console.error("Ei voitu ladata statistiikkoja")
    }
  }

  async function loadUsers() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch {
      console.error("Ei voitu ladata käyttäjiä")
    } finally {
      setLoading(false)
    }
  }

  async function handleBlockUser(userId: string) {
    if (!confirm(`Estä käyttäjä ${userId}?`)) return

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "block",
          userId: "admin", // Admin blocks user
          targetUserId: userId
        })
      })

      if (response.ok) {
        alert("Käyttäjä estetty!")
        await loadUsers()
      } else {
        alert("Esto epäonnistui")
      }
    } catch {
      alert("Esto epäonnistui")
    }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (!confirm(`POISTA käyttäjä ${userName} (${userId})?\n\nTämä poistaa KAIKEN datan pysyvästi!`)) return

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          targetUserId: userId
        })
      })

      if (response.ok) {
        alert("Käyttäjä poistettu!")
        await loadUsers()
      } else {
        alert("Poisto epäonnistui")
      }
    } catch {
      alert("Poisto epäonnistui")
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      sessionStorage.setItem("admin-auth", "true")
      setError("")
      loadAll()
    } else {
      setError("Väärä salasana")
      setPassword("")
    }
  }

  function handleLogout() {
    setAuthenticated(false)
    sessionStorage.removeItem("admin-auth")
    setPassword("")
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
          <h1 className="font-heading text-2xl">Admin-paneeli</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kirjaudu sisään hallinnoidaksesi sovellusta.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Salasana
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Syötä admin-salasana"
                className="mt-1"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full">
              Kirjaudu sisään
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            Vain ylläpitäjille. Jos et ole admin, palaa takaisin.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="mt-2"
          >
            ← Takaisin etusivulle
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl">Admin-paneeli</h1>
              <p className="text-sm text-muted-foreground">
                Raportit ja moderointi
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Kirjaudu ulos
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={activeTab === 'stats' ? 'default' : 'outline'}
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistiikat
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            👥 Käyttäjät ({users.length})
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'default' : 'outline'}
            onClick={() => setActiveTab('reports')}
          >
            🚨 Raportit ({reports.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAll}
            disabled={loading}
            className="ml-auto"
          >
            {loading ? "Ladataan..." : "🔄 Päivitä kaikki"}
          </Button>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  👥 Käyttäjiä yhteensä
                </h3>
                <p className="mt-2 text-3xl font-bold">{stats.users}</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  💝 Matchit yhteensä
                </h3>
                <p className="mt-2 text-3xl font-bold">{stats.matches}</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  💬 Viestit yhteensä
                </h3>
                <p className="mt-2 text-3xl font-bold">{stats.messages}</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  📊 Matchit per käyttäjä
                </h3>
                <p className="mt-2 text-3xl font-bold">
                  {stats.users > 0 ? (stats.matches / stats.users).toFixed(1) : '0'}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  💬 Viestit per match
                </h3>
                <p className="mt-2 text-3xl font-bold">
                  {stats.matches > 0 ? (stats.messages / stats.matches).toFixed(1) : '0'}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  🚨 Raportit
                </h3>
                <p className="mt-2 text-3xl font-bold">{reports.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Käyttäjät ({users.length})
              </h2>
            </div>

            {users.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Ei käyttäjiä vielä.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    className="rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}, {user.age}</span>
                          <Badge variant="secondary">{user.city}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {user.users.email}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Liittynyt: {new Date(user.users.created_at).toLocaleString("fi-FI")}
                        </p>
                        <p className="mt-1 text-xs font-mono text-muted-foreground">
                          ID: {user.user_id}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBlockUser(user.user_id)}
                        >
                          🚫 Estä
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.user_id, user.name)}
                        >
                          🗑️ Poista
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Raportit ({reports.length})
              </h2>
            </div>

          {reports.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Ei raportteja vielä.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Raportit näkyvät tässä kun käyttäjät ilmoittavat profiileista.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Profiili: {report.personId}</span>
                        <Badge variant="secondary">{report.reason}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ilmoitettu: {new Date(report.at).toLocaleString("fi-FI")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          router.push(`/chat/${report.personId}`)
                        }}
                      >
                        Avaa chat
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBlockUser(report.personId)}
                      >
                        🚫 Estä käyttäjä
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}
      </main>
    </div>
  )
}
