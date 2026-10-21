"use client"

import { useEffect, useMemo, useSyncExternalStore } from "react"
import { emptyDirectory, hiddenIds, likedBy, type Directory } from "@/lib/directory"
import {
  currentDirectory,
  deviceId,
  liveProfile,
  subscribeDirectory,
  syncDirectory,
  whoLikesMe,
} from "@/lib/directory-client"
import { distanceBetween } from "@/lib/distance"
import type { Person, Scene } from "@/lib/people"
import { fitsPreferences, type Attraction, type OwnGender } from "@/lib/profile"
import { usePartner } from "@/lib/store"

export function LiveSync() {
  const { me } = usePartner()
  const name = me.name
  const age = me.age
  const city = me.city
  const gender = me.gender
  const attractedTo = me.attractedTo
  const sexuality = me.sexuality

  useEffect(() => {
    let stopped = false
    const send = () => {
      if (stopped) return
      void syncDirectory(liveProfile({ name, age, city, gender, attractedTo, sexuality }))
    }
    send()
    const timer = window.setInterval(send, 10000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [name, age, city, gender, attractedTo, sexuality])

  return null
}

const liveScene: Scene = {
  sky: "#e7eef5",
  skyDeep: "#d5e2ee",
  ground: "#d7dee6",
  shirt: "#243447",
  hair: "#2a2422",
  skin: "#e4c2ab",
  accent: "#8eafcc",
  hairStyle: "short",
  prop: "bench",
}

type Viewer = {
  ageMin: number
  ageMax: number
  city: string
  distanceKm: number
  attractedTo: Attraction
  gender: OwnGender | null
}

export function useLiveCards(
  me: Viewer,
  blocked: readonly string[],
  decisions: Record<string, string | undefined>,
) {
  const directory = useSyncExternalStore(subscribeDirectory, currentDirectory, () => emptyDirectory)
  return useMemo(() => toCards(directory, me, blocked, decisions), [directory, me, blocked, decisions])
}

export function useLiveLikes() {
  const directory = useSyncExternalStore(subscribeDirectory, currentDirectory, () => emptyDirectory)
  return useMemo(() => {
    let mine = ""
    try {
      mine = deviceId()
    } catch {
      return { who: new Set<string>() }
    }
    return { who: whoLikesMe(mine) }
  }, [directory])
}

function toCards(
  directory: Directory,
  me: Viewer,
  blocked: readonly string[],
  decisions: Record<string, string | undefined>,
): Person[] {
  if (directory.profiles.length === 0) return []
  let mine = ""
  try {
    mine = deviceId()
  } catch {
    return []
  }
  const hidden = hiddenIds(directory, mine)
  const skip = new Set(blocked)
  const who = likedBy(directory, mine)
  const cards: Person[] = []
  for (const profile of directory.profiles) {
    if (profile.id === mine || hidden.has(profile.id) || skip.has(profile.id) || decisions[profile.id]) continue
    if (!visible(profile, me)) continue
    const gender = profile.gender === "mies" || profile.gender === "nainen" ? profile.gender : "mies"
    cards.push({
      id: profile.id,
      name: profile.name,
      age: profile.age,
      city: profile.city,
      gender,
      sexuality: profile.sexuality,
      attractedTo: profile.attractedTo,
      bio: "Käyttää Partneria toisella puhelimella.",
      interests: [],
      likesYou: who.has(profile.id),
      replies: [],
      scene: liveScene,
    })
  }
  return cards
}

function visible(
  profile: { age: number; city: string; gender: OwnGender | null; attractedTo: Attraction },
  me: Viewer,
) {
  if (profile.age < me.ageMin || profile.age > me.ageMax) return false
  const km = distanceBetween(me.city, profile.city)
  if (km != null && km > me.distanceKm) return false
  if (profile.gender === "mies" || profile.gender === "nainen") {
    return fitsPreferences(
      { age: profile.age, gender: profile.gender, city: profile.city, attractedTo: profile.attractedTo },
      me,
    )
  }
  return me.attractedTo === "molemmat"
}
