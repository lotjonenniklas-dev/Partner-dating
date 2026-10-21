import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { findPerson } from "@/lib/people"
import { isReportReason } from "@/lib/report"

export const runtime = "nodejs"

const FILE_LIMIT = 200

function storePath() {
  if (process.env.VERCEL) return "/tmp/partner-reports.json"
  return path.join(process.cwd(), ".data", "partner-reports.json")
}

let queue = Promise.resolve()

function enqueue(task: () => Promise<void>) {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export async function POST(request: Request) {
  const raw = await request.text().catch(() => "")
  if (!raw || raw.length > 2000) {
    return Response.json({ error: "Ilmoitusta ei voitu tallentaa." }, { status: 400 })
  }
  let body: { personId?: unknown; reason?: unknown; at?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return Response.json({ error: "Ilmoitusta ei voitu tallentaa." }, { status: 400 })
  }
  const personId = typeof body.personId === "string" ? body.personId : ""
  if (!personId || personId.length > 40 || !findPerson(personId) || !isReportReason(body.reason)) {
    return Response.json({ error: "Ilmoitusta ei voitu tallentaa." }, { status: 400 })
  }
  const at = typeof body.at === "number" && Number.isFinite(body.at) ? body.at : Date.now()
  const entry = { personId, reason: body.reason, at }
  try {
    await enqueue(async () => {
      const file = storePath()
      await mkdir(path.dirname(file), { recursive: true })
      let current: unknown = []
      try {
        current = JSON.parse(await readFile(file, "utf8"))
      } catch {
        current = []
      }
      const list = Array.isArray(current) ? current : []
      const next = [...list, entry].slice(-FILE_LIMIT)
      await writeFile(file, JSON.stringify(next), "utf8")
    })
  } catch {
    return Response.json({ error: "Ilmoitusta ei voitu tallentaa." }, { status: 500 })
  }
  return Response.json({ ok: true })
}
