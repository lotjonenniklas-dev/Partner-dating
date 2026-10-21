import { readFile } from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "partner-admin-2026"

function storePath() {
  if (process.env.VERCEL) return "/tmp/partner-reports.json"
  return path.join(process.cwd(), ".data", "partner-reports.json")
}

export async function GET(request: Request) {
  // Tarkista admin-salasana headerista
  const authHeader = request.headers.get("authorization")
  const providedPassword = authHeader?.replace("Bearer ", "")

  // Vaihtoehtoinen: Salli ilman auth (turvaton, vain testikäyttöön)
  // Tuotannossa poista tämä ja vaadi aina auth
  const isDev = process.env.NODE_ENV === "development"

  if (!isDev && providedPassword !== ADMIN_PASSWORD) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const file = storePath()
    const content = await readFile(file, "utf8")
    const reports = JSON.parse(content)
    return Response.json({ reports: Array.isArray(reports) ? reports : [] })
  } catch {
    // Tiedostoa ei ole tai se on tyhjä
    return Response.json({ reports: [] })
  }
}
