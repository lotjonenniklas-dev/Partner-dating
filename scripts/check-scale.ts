import { CatalogRanker, boundThreads, DeckWindow, editDeck, likedInCatalogOrder } from "../lib/crowd.ts"
import { rankByCompatibility, rankByCompatibilityYielding } from "../lib/match.ts"
import { findPerson, people } from "../lib/people.ts"
import { fitsPreferences } from "../lib/profile.ts"
import { readLimitedJson } from "../lib/read-body.ts"

const me = {
  age: 29,
  city: "Helsinki",
  interests: ["Koodi", "Kävely", "Kahvi"],
  distanceKm: 600,
  attractedTo: "molemmat" as const,
  gender: null,
  ageMin: 18,
  ageMax: 100,
}

const curated = rankByCompatibility(
  people.filter((person) => fitsPreferences(person, me)),
  me,
)
const curatedAgain = rankByCompatibility(
  people.filter((person) => fitsPreferences(person, me)),
  me,
)
if (curated.length !== people.length) throw new Error(`curated ${curated.length}`)
if (curated.map((person) => person.id).join() !== curatedAgain.map((person) => person.id).join()) {
  throw new Error("rank drifted")
}
if (findPerson("aino")?.name !== "Aino") throw new Error("index")
if (findPerson("missing")) throw new Error("missing index")

const cities = ["Helsinki", "Tampere", "Turku", "Oulu", "Espoo", "Lahti", "Jyväskylä"]
const words = ["Kahvi", "Kävely", "Koodi", "Jazz", "Ruoka", "Kirjat", "Musiikki"]
const crowd = Array.from({ length: 200_000 }, (_, index) => ({
  id: `p${index}`,
  age: 18 + (index % 40),
  city: cities[index % cities.length],
  interests: [words[index % words.length], words[(index + 3) % words.length]],
  gender: index % 2 === 0 ? ("nainen" as const) : ("mies" as const),
  attractedTo: "molemmat" as const,
  likesYou: index % 17 === 0,
}))

const started = performance.now()
const ranked = rankByCompatibility(crowd, me)
const rankMs = performance.now() - started
if (rankMs > 8000) throw new Error(`rank ${rankMs.toFixed(0)}ms`)
if (ranked.length !== crowd.length) throw new Error("rank length")
if (ranked[0].id === ranked[1].id) throw new Error("duplicate head")

const window = new DeckWindow<(typeof ranked)[number]>()
const blocked: string[] = []
let decisions: Record<string, string> = {}
let deck = window.open(ranked, decisions, blocked, 0)
if (deck.length !== ranked.length || deck[0]?.id !== ranked[0].id || deck[1]?.id !== ranked[1].id) {
  throw new Error("opening")
}
const swipeStarted = performance.now()
for (let index = 0; index < 5000; index++) {
  const id = deck[0]?.id
  if (id !== ranked[index].id) throw new Error(`swipe ${index}`)
  editDeck(id)
  decisions = { ...decisions, [id]: "pass" }
  deck = window.open(ranked, decisions, blocked, 0)
}
const swipeMs = performance.now() - swipeStarted
if (swipeMs > 4000) throw new Error(`swipes ${swipeMs.toFixed(0)}ms`)
if (deck[0]?.id !== ranked[5000].id || deck[1]?.id !== ranked[5001].id) throw new Error("head")
if (deck.length !== ranked.length - 5000) throw new Error(`left ${deck.length}`)
const restored = window.open(ranked, {}, blocked, 1)
if (restored.length !== ranked.length || restored[0]?.id !== ranked[0].id) throw new Error("restore")

const likes: Record<string, string> = {}
for (const person of crowd) likes[person.id] = "like"
const byId = new Map(crowd.map((person) => [person.id, person]))
const order = new Map(crowd.map((person, index) => [person.id, index]))
const likeStarted = performance.now()
const pending = likedInCatalogOrder(likes, [], false, (id) => byId.get(id), (id) => order.get(id) ?? 0)
const likeMs = performance.now() - likeStarted
if (likeMs > 500) throw new Error(`likes ${likeMs.toFixed(0)}ms`)
if (pending.length !== crowd.filter((person) => !person.likesYou).length) throw new Error("pending count")
if (pending.some((person) => person.likesYou)) throw new Error("match leaked")

const sample = crowd.slice(0, 5000)
const syncIds = rankByCompatibility(sample, me).map((person) => person.id).join()
const yielded = await rankByCompatibilityYielding(sample, me, () => true, 2000)
if (!yielded || yielded.map((person) => person.id).join() !== syncIds) throw new Error("yield mismatch")

let current = true
const aborting = rankByCompatibilityYielding(sample, me, () => current, 2000)
current = false
if ((await aborting) !== null) throw new Error("abort")

let finished = false
const ranker = new CatalogRanker(crowd, () => true, () => {
  finished = true
})
const provisional = ranker.order(me)
if (provisional.length !== crowd.length) throw new Error("provisional")
const deadline = Date.now() + 5000
while (!finished && Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 20))
}
if (!finished) throw new Error("ranker did not finish")
const settled = ranker.order(me)
if (settled.map((person) => person.id).join() !== ranked.map((person) => person.id).join()) {
  throw new Error("ranker order")
}
if (ranker.order(me) !== settled) throw new Error("cache")

const thread = Array.from({ length: 250 }, (_, index) => index)
const bounded = boundThreads({ aino: thread, elias: [1] })
if (bounded.aino.length !== 200 || bounded.aino[0] !== 50) throw new Error("thread cap")
if (bounded.elias !== boundThreads({ elias: [1] }).elias && bounded.elias.length !== 1) throw new Error("short thread")

const small = new Request("http://local/pay", {
  method: "POST",
  body: JSON.stringify({ token: "test-token" }),
})
const parsed = await readLimitedJson(small)
if ("error" in parsed || (parsed.value as { token?: string }).token !== "test-token") throw new Error("body")

const huge = new Request("http://local/pay", {
  method: "POST",
  headers: { "content-length": "90000" },
  body: "x".repeat(90_000),
})
const rejected = await readLimitedJson(huge)
if (!("error" in rejected)) throw new Error("size")

console.log(`ok rank ${rankMs.toFixed(0)}ms swipes ${swipeMs.toFixed(0)}ms likes ${likeMs.toFixed(0)}ms`)
