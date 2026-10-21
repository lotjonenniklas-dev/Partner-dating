import { readFile } from "node:fs/promises"
import path from "node:path"

const files: Record<string, string> = {
  nsfwjs: "browser/nsfwjs.min.js",
  "nsfw-model": "models/mobilenet_v2/model.min.js",
  "nsfw-weights": "models/mobilenet_v2/group1-shard1of1.min.js",
}

const cache = new Map<string, Blob>()

export async function GET(
  request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params
  const relative = files[file]
  if (!relative) return new Response("Not found", { status: 404 })
  let body = cache.get(file)
  if (!body) {
    const raw = await readFile(path.join(process.cwd(), "node_modules/nsfwjs/dist", relative))
    body = new Blob([new Uint8Array(raw)], { type: "text/javascript; charset=utf-8" })
    cache.set(file, body)
  }
  const headers = {
    "Content-Type": "text/javascript; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
    ETag: `"${file}-${body.size}"`,
  }
  if (request.headers.get("if-none-match") === headers.ETag) {
    return new Response(null, { status: 304, headers })
  }
  return new Response(body, { headers })
}
