import { formatLikeRemaining, LIKE_TTL_MS, settleSentLikes } from "../lib/like-ttl.ts"

const sent = 1_000_000
const at = (hours: number, minutes: number, seconds: number) =>
  sent + LIKE_TTL_MS - (hours * 3600 + minutes * 60 + seconds) * 1000

const full = formatLikeRemaining(sent, sent)
if (full !== "Säilyy vielä 24 t 0 min") throw new Error(full)

const sameMinute = formatLikeRemaining(sent, at(21, 19, 42))
const stillSame = formatLikeRemaining(sent, at(21, 19, 41))
const previousMinute = formatLikeRemaining(sent, at(21, 18, 59))
if (sameMinute !== "Säilyy vielä 21 t 19 min") throw new Error(sameMinute)
if (stillSame !== sameMinute) throw new Error("seconds still change the text")
if (previousMinute !== "Säilyy vielä 21 t 18 min") throw new Error(previousMinute)

const hourBoundary = formatLikeRemaining(sent, at(21, 0, 0))
const afterHour = formatLikeRemaining(sent, at(20, 59, 59))
if (hourBoundary !== "Säilyy vielä 21 t 0 min") throw new Error(hourBoundary)
if (afterHour !== "Säilyy vielä 20 t 59 min") throw new Error(afterHour)

if (formatLikeRemaining(sent, at(0, 4, 5)) !== "Säilyy vielä 4 min") throw new Error("minutes")
if (formatLikeRemaining(sent, at(0, 0, 8)) !== "Säilyy vielä 0 min") throw new Error("under a minute")
if (formatLikeRemaining(sent, sent + LIKE_TTL_MS + 5_000) !== "Säilyy vielä 0 min") throw new Error("expired")

const stamped = settleSentLikes({ elias: "like" }, {}, sent, () => false)
if (stamped.likeSentAt.elias !== sent) throw new Error("stamp")
const again = settleSentLikes(stamped.decisions, stamped.likeSentAt, sent + 60_000, () => false)
if (again.likeSentAt.elias !== sent) throw new Error("clock reset")
if (again.changed) throw new Error("stable like changed")

console.log("ok")
