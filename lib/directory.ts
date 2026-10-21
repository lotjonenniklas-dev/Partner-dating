import type { Attraction, OwnGender, Sexuality } from "@/lib/profile"

export type LiveProfile = {
  id: string
  name: string
  age: number
  city: string
  latitude?: number | null
  longitude?: number | null
  gender: OwnGender | null
  attractedTo: Attraction
  sexuality: Sexuality
  seen: number
}

export type LiveBlock = {
  by: string
  target: string
}

export type LiveLike = {
  by: string
  target: string
  at: number
}

export type Directory = {
  profiles: LiveProfile[]
  blocks: LiveBlock[]
  likes: LiveLike[]
}

export const emptyDirectory: Directory = { profiles: [], blocks: [], likes: [] }

const DEVICE_ID = /^dev_[a-z0-9]{20,40}$/
const FRESH_MS = 2 * 60 * 60 * 1000
const PROFILE_LIMIT = 60
const BLOCK_LIMIT = 300
const LIKE_LIMIT = 500
const LIKE_TTL_MS = 26 * 60 * 60 * 1000

const attractions = new Set<Attraction>(["miehet", "naiset", "molemmat"])
const sexualities = new Set<Sexuality>(["hetero", "homo", "bi", "pan", "aseksuaali", "muu"])
const genders = new Set<OwnGender>(["mies", "nainen", "trans", "muu"])

export function isDeviceId(value: unknown): value is string {
  return typeof value === "string" && DEVICE_ID.test(value)
}

export function readProfile(value: unknown): LiveProfile | null {
  if (!value || typeof value !== "object") return null
  const profile = value as LiveProfile
  if (!isDeviceId(profile.id)) return null
  if (typeof profile.name !== "string") return null
  const name = profile.name.trim()
  if (!name || name.length > 40) return null
  if (typeof profile.age !== "number" || !Number.isInteger(profile.age) || profile.age < 18 || profile.age > 100) {
    return null
  }
  if (typeof profile.city !== "string") return null
  const city = profile.city.trim()
  if (!city || city.length > 40) return null
  if (profile.gender !== null && !genders.has(profile.gender)) return null
  if (!attractions.has(profile.attractedTo) || !sexualities.has(profile.sexuality)) return null
  const seen = typeof profile.seen === "number" && Number.isFinite(profile.seen) ? profile.seen : Date.now()
  const latitude = typeof profile.latitude === "number" && Number.isFinite(profile.latitude) ? profile.latitude : null
  const longitude = typeof profile.longitude === "number" && Number.isFinite(profile.longitude) ? profile.longitude : null
  return { id: profile.id, name, age: profile.age, city, latitude, longitude, gender: profile.gender, attractedTo: profile.attractedTo, sexuality: profile.sexuality, seen }
}

export function readBlock(value: unknown): LiveBlock | null {
  if (!value || typeof value !== "object") return null
  const block = value as LiveBlock
  if (!isDeviceId(block.by) || !isDeviceId(block.target) || block.by === block.target) return null
  return { by: block.by, target: block.target }
}

export function readLike(value: unknown): LiveLike | null {
  if (!value || typeof value !== "object") return null
  const like = value as LiveLike
  if (!isDeviceId(like.by) || !isDeviceId(like.target) || like.by === like.target) return null
  const at = typeof like.at === "number" && Number.isFinite(like.at) ? like.at : Date.now()
  return { by: like.by, target: like.target, at }
}

export function readDirectory(value: unknown): Directory {
  if (!value || typeof value !== "object") return emptyDirectory
  const raw = value as Directory
  const profiles: LiveProfile[] = []
  const blocks: LiveBlock[] = []
  const likes: LiveLike[] = []
  if (Array.isArray(raw.profiles)) {
    for (const item of raw.profiles) {
      const profile = readProfile(item)
      if (profile) profiles.push(profile)
    }
  }
  if (Array.isArray(raw.blocks)) {
    for (const item of raw.blocks) {
      const block = readBlock(item)
      if (block) blocks.push(block)
    }
  }
  if (Array.isArray(raw.likes)) {
    for (const item of raw.likes) {
      const like = readLike(item)
      if (like) likes.push(like)
    }
  }
  return cap({ profiles, blocks, likes })
}

export function mergeDirectory(left: Directory, right: Directory, now = Date.now()): Directory {
  const profiles = new Map<string, LiveProfile>()
  for (const profile of [...left.profiles, ...right.profiles]) {
    if (now - profile.seen > FRESH_MS) continue
    const previous = profiles.get(profile.id)
    if (!previous || profile.seen >= previous.seen) profiles.set(profile.id, profile)
  }
  const blocks = new Map<string, LiveBlock>()
  for (const block of [...left.blocks, ...right.blocks]) {
    blocks.set(`${block.by}:${block.target}`, block)
  }
  const likes = new Map<string, LiveLike>()
  for (const like of [...left.likes, ...right.likes]) {
    if (now - like.at > LIKE_TTL_MS) continue
    const key = `${like.by}:${like.target}`
    const previous = likes.get(key)
    if (!previous || like.at >= previous.at) likes.set(key, like)
  }
  return cap({ profiles: [...profiles.values()], blocks: [...blocks.values()], likes: [...likes.values()] })
}

export function withoutBlocksFrom(directory: Directory, deviceId: string): Directory {
  return {
    profiles: directory.profiles,
    blocks: directory.blocks.filter((block) => block.by !== deviceId),
    likes: directory.likes,
  }
}

export function likedBy(directory: Directory, target: string): Set<string> {
  const result = new Set<string>()
  for (const like of directory.likes) {
    if (like.target === target) result.add(like.by)
  }
  return result
}

export function myLikes(directory: Directory, deviceId: string): Map<string, number> {
  const result = new Map<string, number>()
  for (const like of directory.likes) {
    if (like.by === deviceId) result.set(like.target, like.at)
  }
  return result
}

export function hiddenIds(directory: Directory, deviceId: string) {
  const hidden = new Set<string>()
  for (const block of directory.blocks) {
    if (block.by === deviceId) hidden.add(block.target)
    else if (block.target === deviceId) hidden.add(block.by)
  }
  return hidden
}

function cap(directory: Directory): Directory {
  const profiles = [...directory.profiles].sort((a, b) => b.seen - a.seen).slice(0, PROFILE_LIMIT)
  const blocks = directory.blocks.slice(-BLOCK_LIMIT)
  const likes = [...directory.likes].sort((a, b) => b.at - a.at).slice(0, LIKE_LIMIT)
  return { profiles, blocks, likes }
}
