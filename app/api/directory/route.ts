import {
  isDeviceId,
  mergeDirectory,
  readBlock,
  readDirectory,
  readLike,
  readProfile,
  type Directory,
} from "@/lib/directory"
import { clearBlocksFrom, loadDirectory, saveDirectory } from "@/lib/directory-store"

export const runtime = "nodejs"

function json(directory: Directory, status = 200) {
  return Response.json(directory, { status, headers: { "Cache-Control": "no-store" } })
}

export async function GET() {
  return json(await loadDirectory())
}

export async function POST(request: Request) {
  const raw = await request.text().catch(() => "")
  if (!raw || raw.length > 100_000) return json(await loadDirectory(), 400)
  let body: {
    profile?: unknown
    block?: unknown
    like?: unknown
    clearMine?: unknown
    snapshot?: unknown
  }
  try {
    body = JSON.parse(raw)
  } catch {
    return json(await loadDirectory(), 400)
  }
  if (isDeviceId(body.clearMine)) {
    return json(await clearBlocksFrom(body.clearMine))
  }
  let incoming: Directory = { profiles: [], blocks: [], likes: [] }
  const profile = readProfile(body.profile)
  if (profile) incoming = mergeDirectory(incoming, { profiles: [{ ...profile, seen: Date.now() }], blocks: [], likes: [] })
  const block = readBlock(body.block)
  if (block) incoming = mergeDirectory(incoming, { profiles: [], blocks: [block], likes: [] })
  const like = readLike(body.like)
  if (like) incoming = mergeDirectory(incoming, { profiles: [], blocks: [], likes: [like] })
  if (body.snapshot) incoming = mergeDirectory(incoming, readDirectory(body.snapshot))
  if (incoming.profiles.length === 0 && incoming.blocks.length === 0 && incoming.likes.length === 0) {
    return json(await loadDirectory(), 400)
  }
  return json(await saveDirectory(incoming))
}
