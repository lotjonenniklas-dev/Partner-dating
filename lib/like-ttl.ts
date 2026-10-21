export const LIKE_TTL_MS = 24 * 60 * 60 * 1000

type Decision = "like" | "pass"

export function readLikeSentAt(value: unknown) {
  if (!value || typeof value !== "object") return {}
  const times: Record<string, number> = {}
  for (const [id, at] of Object.entries(value)) {
    if (typeof at === "number" && Number.isFinite(at)) times[id] = at
  }
  return times
}

export function settleSentLikes(
  decisions: Record<string, Decision>,
  likeSentAt: Record<string, number>,
  now: number,
  isMatch: (id: string) => boolean,
) {
  const nextDecisions = { ...decisions }
  const nextTimes = { ...likeSentAt }
  let changed = false

  for (const [id, decision] of Object.entries(nextDecisions)) {
    if (decision !== "like" || isMatch(id)) {
      if (id in nextTimes) {
        delete nextTimes[id]
        changed = true
      }
      continue
    }
    const sentAt = nextTimes[id]
    if (typeof sentAt !== "number") {
      nextTimes[id] = now
      changed = true
      continue
    }
    if (now - sentAt >= LIKE_TTL_MS) {
      delete nextDecisions[id]
      delete nextTimes[id]
      changed = true
    }
  }

  for (const id of Object.keys(nextTimes)) {
    if (nextDecisions[id] === "like" && !isMatch(id)) continue
    delete nextTimes[id]
    changed = true
  }

  return { decisions: nextDecisions, likeSentAt: nextTimes, changed }
}

export function formatLikeRemaining(sentAt: number, now: number) {
  const left = sentAt + LIKE_TTL_MS - now
  const totalSeconds = Math.max(0, Math.floor(left / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `Säilyy vielä ${hours} t ${minutes} min`
  return `Säilyy vielä ${minutes} min`
}
