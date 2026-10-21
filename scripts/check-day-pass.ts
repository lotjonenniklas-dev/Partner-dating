import { DAY_PASS_MS, dayPassUntil, formatDayPassRemaining } from "../lib/day-pass.ts"

const paid = 5_000_000
const until = dayPassUntil(paid)
if (until - paid !== 24 * 60 * 60 * 1000) throw new Error("not 24 hours")
if (until - paid !== DAY_PASS_MS) throw new Error("constant")

const full = formatDayPassRemaining(until, paid)
if (full !== "Rajattomat tykkäykset käytössä vielä 24 t 0 min") throw new Error(full)

const later = formatDayPassRemaining(until, paid + 61 * 1000)
if (later !== "Rajattomat tykkäykset käytössä vielä 23 t 58 min") throw new Error(later)

const sameMinute = formatDayPassRemaining(until, paid + 90 * 1000)
if (sameMinute !== later) throw new Error("seconds still change the text")

const minutesOnly = formatDayPassRemaining(until, until - 4 * 60 * 1000)
if (minutesOnly !== "Rajattomat tykkäykset käytössä vielä 4 min") throw new Error(minutesOnly)

const done = formatDayPassRemaining(until, until + 1000)
if (done !== "Rajattomat tykkäykset käytössä vielä 0 min") throw new Error(done)

console.log("ok")
