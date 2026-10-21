export const DAY_PASS_MS = 24 * 60 * 60 * 1000

export function dayPassUntil(paidAt: number) {
  return paidAt + DAY_PASS_MS
}

export function formatDayPassRemaining(until: number, now: number) {
  const totalSeconds = Math.max(0, Math.floor((until - now) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `Rajattomat tykkäykset käytössä vielä ${hours} t ${minutes} min`
  return `Rajattomat tykkäykset käytössä vielä ${minutes} min`
}
