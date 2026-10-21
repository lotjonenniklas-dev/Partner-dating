import { rankByCompatibility, rankByCompatibilityYielding, type MatchProfile } from "./match"
import type { Attraction, OwnGender } from "./profile"

export const RANK_SYNC_LIMIT = 2500
export const LIST_PAGE = 40
export const THREAD_LIMIT = 200
export const MAX_API_BYTES = 65_536

type Preferences = MatchProfile & {
  attractedTo: Attraction
  gender: OwnGender | null
  ageMin: number
  ageMax: number
}

export function preferenceKey(me: Preferences) {
  return [
    me.attractedTo,
    me.gender ?? "",
    me.ageMin,
    me.ageMax,
    me.city,
    me.distanceKm,
    me.age,
    me.interests.join("\u0001"),
  ].join("\u0000")
}

export function unseenInOrder<T extends { id: string }>(
  order: readonly T[],
  decisions: Record<string, string | undefined>,
  blocked: readonly string[],
) {
  let decided = false
  for (const id in decisions) {
    decided = true
    break
  }
  if (!decided && blocked.length === 0) return order as T[]
  if (blocked.length === 0) return order.filter((person) => decisions[person.id] === undefined)
  const skip = new Set(blocked)
  return order.filter((person) => decisions[person.id] === undefined && !skip.has(person.id))
}

export function likedInCatalogOrder<T extends { id: string; likesYou: boolean }>(
  decisions: Record<string, string | undefined>,
  blocked: readonly string[],
  likesYou: boolean,
  find: (id: string) => T | undefined,
  indexOf: (id: string) => number,
) {
  const skip = blocked.length === 0 ? null : new Set(blocked)
  const found: { person: T; index: number }[] = []
  for (const id in decisions) {
    if (decisions[id] !== "like" || skip?.has(id)) continue
    const person = find(id)
    if (!person || person.likesYou !== likesYou) continue
    found.push({ person, index: indexOf(id) })
  }
  found.sort((a, b) => a.index - b.index)
  return found.map((item) => item.person)
}

const decisionTally = new WeakMap<object, number>()

export function tallyDecisions(decisions: object) {
  const known = decisionTally.get(decisions)
  if (known !== undefined) return known
  let count = 0
  for (const id in decisions) {
    if (decisions[id as keyof typeof decisions] !== undefined) count++
  }
  decisionTally.set(decisions, count)
  return count
}

export function rememberDecisions(decisions: object, count: number) {
  decisionTally.set(decisions, count)
}

export function countUnseen(
  total: number,
  decisions: Record<string, string | undefined>,
  blocked: readonly string[],
) {
  let excluded = tallyDecisions(decisions)
  for (const id of blocked) if (decisions[id] === undefined) excluded++
  return total - excluded
}

export type CardDeck<T> = {
  readonly length: number
  readonly [index: number]: T | undefined
}

let pendingDrop: string | null = null

export function editDeck(id: string) {
  pendingDrop = id
}

const emptyBlocked = new Set<string>()

export class DeckWindow<T extends { id: string }> {
  private order: readonly T[] | null = null
  private decisions: Record<string, string | undefined> | null = null
  private blocked: readonly string[] | null = null
  private blockedSet: ReadonlySet<string> = emptyBlocked
  private inOrder: ReadonlySet<string> = emptyBlocked
  private scan = 0
  private remaining = 0
  private first: T | undefined
  private second: T | undefined
  private epoch = -1

  open(
    order: readonly T[],
    decisions: Record<string, string | undefined>,
    blocked: readonly string[],
    epoch: number,
  ): CardDeck<T> {
    const drop = pendingDrop
    pendingDrop = null
    if (this.order !== order || this.blocked !== blocked || this.epoch !== epoch) {
      this.rebuild(order, decisions, blocked, epoch)
    } else if (drop && this.decisions !== decisions) {
      this.drop(drop, decisions)
    } else if (this.decisions !== decisions) {
      this.rebuild(order, decisions, blocked, epoch)
    }
    return { length: this.remaining, 0: this.first, 1: this.second }
  }

  private rebuild(
    order: readonly T[],
    decisions: Record<string, string | undefined>,
    blocked: readonly string[],
    epoch: number,
  ) {
    this.order = order
    this.decisions = decisions
    this.blocked = blocked
    this.epoch = epoch
    this.blockedSet = blocked.length === 0 ? emptyBlocked : new Set(blocked)
    const inOrder = new Set<string>()
    for (let index = 0; index < order.length; index++) inOrder.add(order[index].id)
    this.inOrder = inOrder
    let removed = 0
    for (const id in decisions) if (inOrder.has(id)) removed++
    for (const id of blocked) if (decisions[id] === undefined && inOrder.has(id)) removed++
    this.remaining = order.length - removed
    this.resolve(0)
  }

  private drop(id: string, decisions: Record<string, string | undefined>) {
    this.decisions = decisions
    if (!this.inOrder.has(id)) return
    this.remaining = Math.max(0, this.remaining - 1)
    if (this.first?.id === id) this.resolve(this.scan)
    else if (this.second?.id === id) this.second = this.after(this.scan + 1)
  }

  private excluded(person: T) {
    return this.decisions![person.id] !== undefined || this.blockedSet.has(person.id)
  }

  private resolve(from: number) {
    const order = this.order!
    let first: T | undefined
    let second: T | undefined
    let scan = order.length
    for (let index = from; index < order.length; index++) {
      const person = order[index]
      if (this.excluded(person)) continue
      if (!first) {
        first = person
        scan = index
        continue
      }
      second = person
      break
    }
    this.scan = first ? scan : order.length
    this.first = first
    this.second = second
  }

  private after(from: number) {
    const order = this.order!
    for (let index = from; index < order.length; index++) {
      const person = order[index]
      if (!this.excluded(person)) return person
    }
    return undefined
  }
}

export function boundThreads<T>(messages: Record<string, T[]>, limit = THREAD_LIMIT) {
  let next: Record<string, T[]> | null = null
  for (const id in messages) {
    const thread = messages[id]
    if (!thread || thread.length <= limit) continue
    next ??= { ...messages }
    next[id] = thread.slice(-limit)
  }
  return next ?? messages
}

type Candidate = { id: string; age: number; city: string; interests: string[] }

export class CatalogRanker<T extends Candidate, TMe extends Preferences> {
  private cache: { key: string; order: T[] } | null = null
  private pending = ""
  private generation = 0
  private readonly people: readonly T[]
  private readonly fits: (person: T, me: TMe) => boolean
  private readonly onReady: () => void

  constructor(people: readonly T[], fits: (person: T, me: TMe) => boolean, onReady: () => void) {
    this.people = people
    this.fits = fits
    this.onReady = onReady
  }
  order(me: TMe) {
    const key = preferenceKey(me)
    if (this.cache?.key === key) return this.cache.order
    const fitting = this.people.filter((person) => this.fits(person, me))
    if (fitting.length <= RANK_SYNC_LIMIT) {
      this.generation += 1
      this.pending = ""
      const order = rankByCompatibility(fitting, me)
      this.cache = { key, order }
      return order
    }
    if (this.pending !== key) {
      this.pending = key
      const generation = ++this.generation
      void rankByCompatibilityYielding(fitting, me, () => generation === this.generation).then((order) => {
        if (!order || generation !== this.generation) return
        this.cache = { key, order }
        this.pending = ""
        this.onReady()
      })
    }
    if (this.cache) return this.cache.order.filter((person) => this.fits(person, me))
    return fitting
  }
}
