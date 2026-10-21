import { distanceBetween } from "./distance"

export type MatchProfile = {
  age: number
  city: string
  interests: string[]
  distanceKm: number
}

type Candidate = {
  age: number
  city: string
  interests: string[]
}

type Cluster = { label: string; words: string[] }

const clusters: Cluster[] = [
  { label: "ulkoilu", words: ["kävely", "polkujuoksu", "pyöräily", "metsä", "uinti", "hiihto", "meri"] },
  { label: "kahvi ja tee", words: ["kahvi", "tee", "aamiainen"] },
  { label: "tekeminen", words: ["koodi", "muotoilu", "arkkitehtuuri", "keramiikka", "piirtäminen", "puu", "valokuvaus"] },
  { label: "musiikki", words: ["jazz", "vinyylit", "kitara", "keikat", "musiikki"] },
  { label: "ruoka", words: ["ruoka", "leipominen"] },
  { label: "kirjat", words: ["kirjat", "kirjasto"] },
  { label: "kaupunki", words: ["näyttelyt", "kirpputorit", "elokuvat"] },
]

function norm(value: string) {
  return value.trim().toLocaleLowerCase("fi")
}

const clusterByWord = new Map<string, Cluster>()
for (const cluster of clusters) {
  for (const word of cluster.words) clusterByWord.set(word, cluster)
}

function clusterOf(word: string) {
  return clusterByWord.get(word)
}

export type Compatibility = {
  score: number
  reason: string
}

export function compatibility(person: Candidate, me: MatchProfile): Compatibility {
  const mine = me.interests.map(norm).filter(Boolean)
  const theirs = person.interests.map(norm).filter(Boolean)
  const theirSet = new Set(theirs)
  const theirLabels = new Map(person.interests.map((interest) => [norm(interest), interest]))

  const shared: string[] = []
  const related = new Set<string>()
  let interestPoints = 0
  for (const interest of mine) {
    if (theirSet.has(interest)) {
      shared.push(theirLabels.get(interest) ?? interest)
      interestPoints += 14
      continue
    }
    const cluster = clusterOf(interest)
    if (cluster && theirs.some((word) => cluster.words.includes(word))) {
      related.add(cluster.label)
      interestPoints += 7
    }
  }
  interestPoints = Math.min(42, interestPoints)

  const ageDiff = Math.abs(person.age - me.age)
  const agePoints = 28 * Math.exp(-(ageDiff * ageDiff) / (2 * 4.5 * 4.5))

  const km = distanceBetween(me.city, person.city)
  const span = Math.max(1, me.distanceKm)
  const distancePoints = km == null ? 12 : 30 * (1 - Math.min(1, km / span))

  const score = Math.max(1, Math.min(99, Math.round(interestPoints + agePoints + distancePoints)))

  const reasons: string[] = []
  if (shared.length > 0) {
    const shown = shared.slice(0, 2).map((item) => item.toLocaleLowerCase("fi"))
    reasons.push(shown.length === 1 ? `Yhteistä: ${shown[0]}` : `Yhteistä: ${shown[0]} ja ${shown[1]}`)
  } else if (related.size > 0) {
    const labels = [...related].slice(0, 2)
    reasons.push(
      labels.length === 1
        ? `Läheisiä kiinnostuksia: ${labels[0]}`
        : `Läheisiä kiinnostuksia: ${labels[0]} ja ${labels[1]}`,
    )
  }
  if (reasons.length === 0 && km === 0) reasons.push("Samassa kaupungissa")
  else if (reasons.length === 0 && ageDiff <= 2) reasons.push("Lähellä ikääsi")
  if (reasons.length === 0) reasons.push("Sopii ikään ja etäisyyteen")

  return { score, reason: reasons.slice(0, 2).join(" · ") }
}

export function sortByScore<T extends Candidate>(people: T[], scores: number[]) {
  const rows = people.map((person, index) => ({
    person,
    score: scores[index] ?? 0,
    tie: person.interests.join(),
  }))
  rows.sort((a, b) => b.score - a.score || a.tie.localeCompare(b.tie, "fi"))
  return rows.map((row) => row.person)
}

export function rankByCompatibility<T extends Candidate>(people: T[], me: MatchProfile) {
  const scores = people.map((person) => compatibility(person, me).score)
  return sortByScore(people, scores)
}

export async function rankByCompatibilityYielding<T extends Candidate>(
  people: T[],
  me: MatchProfile,
  isCurrent: () => boolean,
  chunk = 2000,
) {
  const scores = new Array<number>(people.length)
  for (let start = 0; start < people.length; start += chunk) {
    if (!isCurrent()) return null
    const end = Math.min(people.length, start + chunk)
    for (let index = start; index < end; index++) {
      scores[index] = compatibility(people[index], me).score
    }
    if (end < people.length) await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
  if (!isCurrent()) return null
  return sortByScore(people, scores)
}
