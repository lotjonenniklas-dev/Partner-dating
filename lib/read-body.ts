import { MAX_API_BYTES } from "./crowd.ts"

export async function readLimitedJson(request: Request, max = MAX_API_BYTES) {
  const declared = request.headers.get("content-length")
  if (declared && Number(declared) > max) return { error: "too-large" as const }
  if (!request.body) return { value: null }
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > max) {
      await reader.cancel().catch(() => undefined)
      return { error: "too-large" as const }
    }
    chunks.push(value)
  }
  if (total === 0) return { value: null }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  try {
    return { value: JSON.parse(new TextDecoder().decode(bytes)) as unknown }
  } catch {
    return { value: null }
  }
}
