import {
  emptyDirectory,
  hiddenIds,
  isDeviceId,
  likedBy,
  mergeDirectory,
  myLikes,
  readDirectory,
  type Directory,
  type LiveProfile,
} from "@/lib/directory"
import type { Attraction, OwnGender, Sexuality } from "@/lib/profile"
import { sendPushToDevice } from "./push-subscriptions"

const DEVICE_KEY = "partner-device"
const LOCAL_KEY = "partner-directory"

let directory = emptyDirectory
const droppedBlocks = new Set<string>()
const listeners = new Set<() => void>()

function keep(next: Directory) {
  if (droppedBlocks.size === 0) return next
  return {
    profiles: next.profiles,
    blocks: next.blocks.filter((block) => !droppedBlocks.has(`${block.by}:${block.target}`)),
    likes: next.likes,
  }
}

function emit(next: Directory) {
  directory = next
  for (const listener of listeners) listener()
}

export function subscribeDirectory(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function currentDirectory() {
  return directory
}

export function deviceId() {
  const existing = localStorage.getItem(DEVICE_KEY)
  if (isDeviceId(existing)) return existing
  const created = `dev_${crypto.randomUUID().replaceAll("-", "")}`
  localStorage.setItem(DEVICE_KEY, created)
  return created
}

function readLocal() {
  try {
    return readDirectory(JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"))
  } catch {
    return emptyDirectory
  }
}

function writeLocal(next: Directory) {
  directory = next
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
  emit(next)
}

export function liveProfile(me: {
  name: string
  age: number
  city: string
  gender: OwnGender | null
  attractedTo: Attraction
  sexuality: Sexuality
}): LiveProfile | null {
  const name = me.name.trim()
  const city = me.city.trim()
  if (!name || !city || me.age < 18) return null
  return {
    id: deviceId(),
    name,
    age: me.age,
    city,
    gender: me.gender,
    attractedTo: me.attractedTo,
    sexuality: me.sexuality,
    seen: Date.now(),
  }
}

async function post(body: unknown) {
  const response = await fetch("/api/directory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) return null
  return readDirectory(await response.json().catch(() => null))
}

export async function syncDirectory(profile: LiveProfile | null) {
  const local = keep(mergeDirectory(directory, readLocal()))
  const response = await fetch("/api/directory").catch(() => null)
  const remote = response?.ok ? readDirectory(await response.json().catch(() => null)) : emptyDirectory
  let next = keep(mergeDirectory(local, remote))
  if (profile) next = mergeDirectory(next, { profiles: [profile], blocks: [], likes: [] })
  next = keep(next)
  const remoteIds = new Set(remote.blocks.map((block) => `${block.by}:${block.target}`))
  const missingBlock = next.blocks.some((block) => !remoteIds.has(`${block.by}:${block.target}`))
  const remoteLikes = new Set(remote.likes.map((like) => `${like.by}:${like.target}`))
  const missingLike = next.likes.some((like) => !remoteLikes.has(`${like.by}:${like.target}`))
  const remoteProfiles = new Set(remote.profiles.map((item) => item.id))
  const missingProfile = profile ? !remoteProfiles.has(profile.id) : false
  if (missingBlock || missingLike || missingProfile || profile) {
    const saved = await post({
      profile,
      snapshot: missingBlock || missingLike ? { profiles: [], blocks: next.blocks, likes: next.likes } : undefined,
    }).catch(() => null)
    if (saved) next = keep(mergeDirectory(next, saved))
  }
  writeLocal(next)
}

export async function blockDevice(target: string) {
  if (!isDeviceId(target)) return
  const block = { by: deviceId(), target }
  writeLocal(mergeDirectory(mergeDirectory(directory, readLocal()), { profiles: [], blocks: [block], likes: [] }))
  const saved = await post({ block }).catch(() => null)
  if (saved) writeLocal(mergeDirectory(currentDirectory(), saved))
}

export async function clearMyBlocks() {
  let id = ""
  try {
    id = deviceId()
  } catch {
    return
  }
  const local = mergeDirectory(directory, readLocal())
  for (const block of local.blocks) {
    if (block.by === id) droppedBlocks.add(`${block.by}:${block.target}`)
  }
  writeLocal(keep({ profiles: local.profiles, blocks: local.blocks.filter((block) => block.by !== id), likes: local.likes }))
  const saved = await post({ clearMine: id }).catch(() => null)
  if (saved) writeLocal(mergeDirectory(currentDirectory(), saved))
}

export function blockedDevices(device: string) {
  return hiddenIds(directory, device)
}

export async function likeDevice(target: string, myName?: string) {
  if (!isDeviceId(target)) return
  const myDevice = deviceId()
  const like = { by: myDevice, target, at: Date.now() }
  
  // Tarkista onko match (toinen tykkäsi jo minusta)
  const theyLikedMe = likedBy(directory, myDevice).has(target)
  
  writeLocal(mergeDirectory(mergeDirectory(directory, readLocal()), { profiles: [], blocks: [], likes: [like] }))
  const saved = await post({ like }).catch(() => null)
  if (saved) writeLocal(mergeDirectory(currentDirectory(), saved))
  
  // Jos match, lähetä push-ilmoitus toiselle laitteelle
  if (theyLikedMe && myName) {
    void sendPushToDevice(target, {
      title: "Uusi osuma! 💝",
      body: `${myName} tykkäsi sinusta takaisin.`,
      url: `/chat/${myDevice}`,
      tag: `match-${myDevice}`,
    }).catch(() => {
      // Ei haittaa jos ilmoitus ei mene perille
    })
  } else {
    // Ei vielä match, lähetä "joku tykkäsi sinusta" ilmoitus
    void sendPushToDevice(target, {
      title: "Uusi tykkäys 💕",
      body: "Joku tykkäsi sinusta. Tykkää takaisin nähdäksesi kuka!",
      url: "/likes",
      tag: `like-${myDevice}`,
    }).catch(() => {
      // Ei haittaa jos ilmoitus ei mene perille
    })
  }
  
  return saved
}

export function whoLikesMe(device: string) {
  return likedBy(directory, device)
}

export function myRemoteLikes(device: string) {
  return myLikes(directory, device)
}
