"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import {
  boundThreads,
  type CardDeck,
  CatalogRanker,
  countUnseen,
  DeckWindow,
  editDeck,
  likedInCatalogOrder,
  rememberDecisions,
  tallyDecisions,
} from "@/lib/crowd"
import { dayPassUntil } from "@/lib/day-pass"
import { readLikeSentAt, settleSentLikes } from "@/lib/like-ttl"
import { pushNotice } from "@/lib/notifications"
import { clearMyBlocks, likeDevice } from "@/lib/directory-client"
import { people, type Person } from "@/lib/people"
import { getCachedProfiles, findCachedPerson, getCatalogIndex } from "@/lib/profile-cache"
import { sendMatchNotification, getStoredSubscription } from "@/lib/send-notification"
import { getCurrentUserId } from "@/lib/photo-upload"
import {
  AGE_MAX,
  AGE_MIN,
  DISTANCE_MAX,
  DISTANCE_MIN,
  DISTANCE_STEP,
  PHOTO_MAX,
  normalizeHeight,
  type Attraction,
  fitsPreferences,
  type OwnGender,
  type Sexuality,
} from "@/lib/profile"
import {
  saveProfile,
  savePhotos,
  recordLike,
  getOrCreateUser,
  sendMessage as supabaseSendMessage,
  getMatchId,
} from "@/lib/supabase-helpers"
import { isSupabaseConfigured } from "@/lib/supabase"

export type Profile = {
  name: string
  age: number
  city: string
  latitude: number | null
  longitude: number | null
  bio: string
  interests: string[]
  gender: OwnGender | null
  attractedTo: Attraction
  sexuality: Sexuality
  ageMin: number
  ageMax: number
  distanceKm: number
  heightCm: number | null
  photos: string[]
}

export type ChatMessage = {
  id: string
  from: "me" | "them"
  text: string
  at: number
}

type Decision = "like" | "pass"

type Persisted = {
  me: Profile
  decisions: Record<string, Decision>
  messages: Record<string, ChatMessage[]>
  openedChats: string[]
  likesSent: number
  freeResetAt: number | null
  unlimitedUntil: number | null
  likeSentAt: Record<string, number>
  blocked: string[]
}

type Snapshot = {
  ready: boolean
  notice: string | null
  data: Persisted
}

function releasePerson(current: Persisted, id: string) {
  const decisions = { ...current.decisions }
  const hadDecision = decisions[id] !== undefined
  delete decisions[id]
  const messages = { ...current.messages }
  delete messages[id]
  const likeSentAt = { ...current.likeSentAt }
  delete likeSentAt[id]
  return {
    decisions,
    hadDecision,
    messages,
    likeSentAt,
    openedChats: current.openedChats.filter((chatId) => chatId !== id),
  }
}

type StoreValue = {
  ready: boolean
  notice: string | null
  dismissNotice: () => void
  me: Profile
  deck: CardDeck<Person>
  matches: Person[]
  pending: Person[]
  passedCount: number
  filteredCount: number
  typingId: string | null
  messagesFor: (id: string) => ChatMessage[]
  openedChatIds: string[]
  openChat: (id: string) => void
  like: (id: string, onMatch?: () => void) => "match" | "pending" | "limited"
  pass: (id: string) => void
  block: (id: string) => void
  confirmLiveMatch: (id: string) => void
  blocked: string[]
  decisions: Record<string, "like" | "pass" | undefined>
  returnToDeck: (id: string) => void
  send: (id: string, text: string) => void
  updateMe: (profile: Profile) => void
  setAttractedTo: (attractedTo: Attraction) => void
  setDistanceKm: (distanceKm: number) => void
  restorePassed: () => void
  reset: () => void
  likesLocked: boolean
  freeResetAt: number | null
  unlimitedUntil: number | null
  unlockDay: () => void
  likeSentAt: Record<string, number>
}

const STORAGE_KEY = "partner-v1"
export const FREE_LIKES = 10

export const defaultProfile: Profile = {
  name: "Niklas",
  age: 29,
  city: "Helsinki",
  latitude: null,
  longitude: null,
  bio: "Rakennan asioita, joita haluan itsekin käyttää. Etsin seuraa, jonka kanssa arki ei tunnu suoritukselta.",
  interests: ["Koodi", "Kävely", "Kahvi"],
  gender: null,
  attractedTo: "molemmat",
  sexuality: "hetero",
  ageMin: AGE_MIN,
  ageMax: AGE_MAX,
  distanceKm: DISTANCE_MAX,
  heightCm: null,
  photos: [],
}

const blankProfile: Profile = {
  name: "",
  age: 0,
  city: "",
  latitude: null,
  longitude: null,
  bio: "",
  interests: [],
  gender: null,
  attractedTo: "molemmat",
  sexuality: "hetero",
  ageMin: AGE_MIN,
  ageMax: AGE_MAX,
  distanceKm: DISTANCE_MAX,
  heightCm: null,
  photos: [],
}

const emptyState: Persisted = {
  me: defaultProfile,
  decisions: {},
  messages: {},
  openedChats: [],
  likesSent: 0,
  freeResetAt: null,
  unlimitedUntil: null,
  likeSentAt: {},
  blocked: [],
}

const serverSnapshot: Snapshot = {
  ready: false,
  notice: null,
  data: emptyState,
}

let snapshot: Snapshot = serverSnapshot
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function isAttraction(value: unknown): value is Attraction {
  return value === "miehet" || value === "naiset" || value === "molemmat"
}

function isSexuality(value: unknown): value is Sexuality {
  return (
    value === "hetero" ||
    value === "homo" ||
    value === "bi" ||
    value === "pan" ||
    value === "aseksuaali" ||
    value === "muu"
  )
}

function isOwnGender(value: unknown): value is OwnGender {
  return value === "mies" || value === "nainen" || value === "trans" || value === "muu"
}

function clampAgeBound(value: unknown, fallback: number) {
  const number = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(AGE_MAX, Math.max(AGE_MIN, Math.round(number)))
}

function clampDistance(value: unknown) {
  const number = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(number)) return DISTANCE_MAX
  const snapped = Math.round(number / DISTANCE_STEP) * DISTANCE_STEP
  return Math.min(DISTANCE_MAX, Math.max(DISTANCE_MIN, snapped))
}

function normalizePhotos(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === "string" && item.startsWith("data:image/"))
    .slice(0, PHOTO_MAX)
}

function normalizeProfile(value: Profile): Profile {
  let ageMin = clampAgeBound(value.ageMin, AGE_MIN)
  let ageMax = clampAgeBound(value.ageMax, AGE_MAX)
  if (ageMin > ageMax) [ageMin, ageMax] = [ageMax, ageMin]
  return {
    ...defaultProfile,
    ...value,
    interests: value.interests,
    gender: isOwnGender(value.gender) ? value.gender : null,
    attractedTo: isAttraction(value.attractedTo) ? value.attractedTo : defaultProfile.attractedTo,
    sexuality: isSexuality(value.sexuality) ? value.sexuality : defaultProfile.sexuality,
    ageMin,
    ageMax,
    distanceKm: clampDistance(value.distanceKm),
    heightCm: normalizeHeight(value.heightCm),
    photos: normalizePhotos(value.photos),
  }
}

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false
  const profile = value as Profile
  return (
    typeof profile.name === "string" &&
    typeof profile.age === "number" &&
    typeof profile.city === "string" &&
    typeof profile.bio === "string" &&
    Array.isArray(profile.interests) &&
    profile.interests.every((item) => typeof item === "string")
  )
}

function normalizeOpened(value: unknown, messages: Record<string, ChatMessage[]>) {
  const started = new Set(
    Object.entries(messages)
      .filter(([, thread]) => thread.some((message) => message.from === "me"))
      .map(([id]) => id),
  )
  if (!Array.isArray(value)) return [...started]
  return value.filter((id): id is string => typeof id === "string" && started.has(id))
}

function readBlocked(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))]
}

function isMatch(id: string) {
  return Boolean(findCachedPerson(id)?.likesYou)
}

function readStorage(): { data: Persisted; notice: string | null; persist: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { data: emptyState, notice: null, persist: false }
    const parsed = JSON.parse(raw) as Partial<Persisted>
    if (!isProfile(parsed.me) || !parsed.decisions || !parsed.messages) {
      return {
        data: emptyState,
        notice: "Tallennetut tiedot olivat rikki, joten aloitettiin puhtaalta pöydältä.",
        persist: false,
      }
    }
    const settled = settleSentLikes(
      parsed.decisions,
      readLikeSentAt(parsed.likeSentAt),
      Date.now(),
      isMatch,
    )
    const decisions = settled.decisions
    const counted = Object.values(decisions).filter((decision) => decision === "like").length
    const storedLikes =
      typeof parsed.likesSent === "number" && Number.isFinite(parsed.likesSent)
        ? Math.max(0, Math.floor(parsed.likesSent))
        : 0
    const freeResetAt =
      typeof parsed.freeResetAt === "number" && Number.isFinite(parsed.freeResetAt)
        ? parsed.freeResetAt
        : null
    
    // Nollaa ilmaiset tykkäykset jos 10h on kulunut
    const now = Date.now()
    const shouldReset = freeResetAt && now >= freeResetAt
    
    return {
      data: {
        me: normalizeProfile(parsed.me),
        decisions,
        messages: parsed.messages,
        openedChats: normalizeOpened(parsed.openedChats, parsed.messages),
        likesSent: shouldReset ? 0 : Math.max(storedLikes, counted),
        freeResetAt: shouldReset ? null : freeResetAt,
        unlimitedUntil:
          typeof parsed.unlimitedUntil === "number" && Number.isFinite(parsed.unlimitedUntil)
            ? parsed.unlimitedUntil
            : null,
        likeSentAt: settled.likeSentAt,
        blocked: readBlocked(parsed.blocked),
      },
      notice: null,
      persist: settled.changed,
    }
  } catch {
    return {
      data: emptyState,
      notice: "Tallennettuja tietoja ei voitu lukea, joten aloitettiin puhtaalta pöydältä.",
      persist: false,
    }
  }
}

/**
 * Sync profile to Supabase (runs in background, doesn't block UI)
 */
async function syncToSupabase(profile: Profile) {
  try {
    // Get session to find user email
    const sessionJson = localStorage.getItem('GOOGLE_SESSION')
    if (!sessionJson) {
      console.log('[Supabase] No session, skipping sync')
      return
    }
    
    const session = JSON.parse(sessionJson)
    const email = session.email
    if (!email) {
      console.log('[Supabase] No email in session, skipping sync')
      return
    }
    
    // Get or create user ID
    const userId = await getOrCreateUser(email)
    if (!userId) {
      console.log('[Supabase] Failed to get user ID')
      return
    }
    
    // Save profile
    const profileSaved = await saveProfile(userId, {
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      looking_for: profile.attractedTo,
      bio: profile.bio,
      interests: profile.interests,
      city: profile.city,
      height: profile.heightCm,
    })
    
    if (profileSaved) {
      console.log('[Supabase] ✅ Profile synced')
    }
    
    // Save photos
    if (profile.photos && profile.photos.length > 0) {
      const photosSaved = await savePhotos(userId, profile.photos)
      if (photosSaved) {
        console.log('[Supabase] ✅ Photos synced')
      }
    }
  } catch (error) {
    console.error('[Supabase] Sync error:', error)
  }
}

/**
 * Sync like to Supabase (runs in background)
 */
async function syncLikeToSupabase(likedId: string) {
  try {
    const sessionJson = localStorage.getItem('GOOGLE_SESSION')
    if (!sessionJson) return
    
    const session = JSON.parse(sessionJson)
    const email = session.email
    if (!email) return
    
    const userId = await getOrCreateUser(email)
    if (!userId) return
    
    // Record the like in Supabase
    await recordLike(userId, likedId)
    console.log('[Supabase] ✅ Like synced')
  } catch (error) {
    console.error('[Supabase] Like sync error:', error)
  }
}

/**
 * Sync message to Supabase (runs in background)
 */
async function syncMessageToSupabase(personId: string, content: string) {
  try {
    const sessionJson = localStorage.getItem('GOOGLE_SESSION')
    if (!sessionJson) return
    
    const session = JSON.parse(sessionJson)
    const email = session.email
    if (!email) return
    
    const userId = await getOrCreateUser(email)
    if (!userId) return
    
    // Get the real match ID from database
    const matchId = await getMatchId(userId, personId)
    if (!matchId) {
      console.log('[Supabase] No match found, cannot send message')
      return
    }
    
    // Send message to Supabase with real match ID
    await supabaseSendMessage(matchId, userId, content)
    console.log('[Supabase] ✅ Message synced')
  } catch (error) {
    console.error('[Supabase] Message sync error:', error)
  }
}

function getSnapshot() {
  return snapshot
}

function getServerSnapshot() {
  return serverSnapshot
}

function commit(data: Persisted, notice = snapshot.notice) {
  const messages = boundThreads(data.messages)
  const bounded = messages === data.messages ? data : { ...data, messages }
  snapshot = { ready: true, notice, data: bounded }
  
  const json = JSON.stringify(bounded)
  const sizeKB = (json.length / 1024).toFixed(1)
  const photoCount = bounded.me.photos?.length ?? 0
  
  try {
    console.log(`[Storage] Saving ${sizeKB}KB, ${photoCount} photos`)
    localStorage.setItem(STORAGE_KEY, json)
    console.log('[Storage] ✅ Save successful!')
    
    // Sync to Supabase in background (don't block UI)
    if (isSupabaseConfigured()) {
      syncToSupabase(bounded.me).catch(err => {
        console.error('[Supabase] Background sync failed:', err)
      })
    }
    
    // Show success notice
    if (photoCount > 0 && !notice) {
      snapshot = { ...snapshot, notice: `✅ ${photoCount} kuvaa tallennettu (${sizeKB}KB)` }
      setTimeout(() => {
        if (snapshot.notice?.startsWith('✅')) {
          snapshot = { ...snapshot, notice: null }
          emit()
        }
      }, 3000)
    }
  } catch (error) {
    console.error('[Storage] ❌ Save failed:', error)
    const errorMsg = error instanceof Error ? error.message : 'Tuntematon virhe'
    
    // Calculate how much space is used
    let usedKB = 0
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          usedKB += ((localStorage[key].length + key.length) * 2) / 1024
        }
      }
    } catch {}
    
    snapshot = {
      ...snapshot,
      notice: `❌ TALLENNUS EPÄONNISTUI! ${photoCount} kuvaa (${sizeKB}KB). localStorage: ${usedKB.toFixed(0)}KB käytössä. Virhe: ${errorMsg}. → Paina "Tyhjennä välimuisti" alhaalla!`,
    }
  }
  emit()
}

function dismissNotice() {
  if (!snapshot.notice) return
  snapshot = { ...snapshot, notice: null }
  emit()
}

let viewMemo: {
  order: Person[]
  decisions: Persisted["decisions"]
  blocked: string[]
  deck: CardDeck<Person>
  matches: Person[]
  pending: Person[]
  unseen: number
  passedCount: number
} | null = null

let deckEpoch = 0

const deckWindow = new DeckWindow<Person>()

// Create ranker with cached profiles (updates when cache refreshes)
let ranker = new CatalogRanker(getCachedProfiles(), fitsPreferences, () => {
  viewMemo = null
  deckEpoch++
  snapshot = { ...snapshot }
  emit()
})

// Refresh ranker when profile cache updates
export function refreshRanker() {
  ranker = new CatalogRanker(getCachedProfiles(), fitsPreferences, () => {
    viewMemo = null
    deckEpoch++
    snapshot = { ...snapshot }
    emit()
  })
  viewMemo = null
  deckEpoch++
  snapshot = { ...snapshot }
  emit()
}

function passedIn(decisions: Persisted["decisions"]) {
  let passed = 0
  for (const id in decisions) if (decisions[id] === "pass") passed++
  return passed
}

function viewFor(data: Persisted) {
  const order = ranker.order(data.me)
  if (
    viewMemo &&
    viewMemo.order === order &&
    viewMemo.decisions === data.decisions &&
    viewMemo.blocked === data.blocked
  ) {
    return viewMemo
  }
  const deck = deckWindow.open(order, data.decisions, data.blocked, deckEpoch)
  const matches = likedInCatalogOrder(data.decisions, data.blocked, true, findCachedPerson, getCatalogIndex())
  const pending = likedInCatalogOrder(data.decisions, data.blocked, false, findCachedPerson, getCatalogIndex())
  const unseen = countUnseen(getCachedProfiles().length, data.decisions, data.blocked)
  viewMemo = {
    order,
    decisions: data.decisions,
    blocked: data.blocked,
    deck,
    matches,
    pending,
    unseen,
    passedCount: passedIn(data.decisions),
  }
  return viewMemo
}

const StoreContext = createContext<StoreValue | null>(null)

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [typingId, setTypingId] = useState<string | null>(null)
  const replyTimer = useRef<number | null>(null)
  const replyFor = useRef<string | null>(null)

  useEffect(() => {
    if (!snapshot.ready) {
      const stored = readStorage()
      snapshot = { ready: true, notice: stored.notice, data: stored.data }
      if (stored.persist) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.data))
        } catch {
          snapshot = { ...snapshot, notice: "Muutoksia ei voitu tallentaa tähän selaimeen." }
        }
      }
      emit()
    }
    function onVisible() {
      if (document.visibilityState !== "visible") return
      const until = snapshot.data.unlimitedUntil
      if (typeof until !== "number") return
      snapshot = { ...snapshot }
      emit()
    }
    document.addEventListener("visibilitychange", onVisible)
    const expiryTimer = window.setInterval(() => {
      if (!snapshot.ready) return
      const settled = settleSentLikes(
        snapshot.data.decisions,
        snapshot.data.likeSentAt ?? {},
        Date.now(),
        isMatch,
      )
      if (!settled.changed) return
      deckEpoch++
      commit({
        ...snapshot.data,
        decisions: settled.decisions,
        likeSentAt: settled.likeSentAt,
      })
    }, 30_000)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.clearInterval(expiryTimer)
      if (replyTimer.current) window.clearTimeout(replyTimer.current)
    }
  }, [])

  const passUntil = snap.ready ? snap.data.unlimitedUntil : null
  useEffect(() => {
    if (typeof passUntil !== "number" || passUntil <= Date.now()) return
    const timer = window.setTimeout(() => {
      snapshot = { ...snapshot }
      emit()
    }, Math.max(0, passUntil - Date.now()))
    return () => window.clearTimeout(timer)
  }, [passUntil])

  const clearReply = useCallback(() => {
    if (replyTimer.current) window.clearTimeout(replyTimer.current)
    replyTimer.current = null
    replyFor.current = null
    setTypingId(null)
  }, [])

  const stopReply = useCallback(
    (id: string) => {
      if (replyFor.current === id) clearReply()
    },
    [clearReply],
  )

  const like = useCallback(
    (id: string, onMatch?: () => void) => {
      const current = snapshot.data
      if (current.blocked.includes(id)) return "pending"
      const unlimited = (current.unlimitedUntil ?? 0) > Date.now()
      const alreadyLiked = current.decisions[id] === "like"
      if (!unlimited && !alreadyLiked && current.likesSent >= FREE_LIKES) return "limited"

      const person = findCachedPerson(id)
      const remote = id.startsWith("dev_")
      const matched = Boolean(person?.likesYou)
      const messages = { ...current.messages }
      if (matched && person?.opener && !messages[id]?.length) {
        messages[id] = [
          {
            id: `${id}-opener`,
            from: "them",
            text: person.opener,
            at: Date.now(),
          },
        ]
      }
      const likeSentAt = { ...current.likeSentAt }
      if (matched) delete likeSentAt[id]
      else if (!alreadyLiked || typeof likeSentAt[id] !== "number") likeSentAt[id] = Date.now()
      const decisions = { ...current.decisions, [id]: "like" as const }
      const added = current.decisions[id] === undefined
      if (added) editDeck(id)
      rememberDecisions(decisions, tallyDecisions(current.decisions) + (added ? 1 : 0))
      if (remote) void likeDevice(id, current.me.name)
      
      // Laske uusi likesSent ja aseta 10h odotusaika jos rajalla
      const newLikesSent = remote || alreadyLiked ? current.likesSent : current.likesSent + 1
      const freeResetAt = !unlimited && newLikesSent >= FREE_LIKES ? Date.now() + 10 * 60 * 60 * 1000 : current.freeResetAt
      
      commit({
        ...current,
        decisions,
        messages,
        likesSent: newLikesSent,
        freeResetAt,
        likeSentAt,
      })
      
      // Sync like to Supabase in background
      if (isSupabaseConfigured() && !alreadyLiked) {
        syncLikeToSupabase(id).catch(err => {
          console.error('[Supabase] Like sync failed:', err)
        })
      }
      
      // Send push notification if it's a new match
      if (matched && person && added) {
        const userId = getCurrentUserId()
        const subscription = getStoredSubscription(userId)
        if (subscription) {
          sendMatchNotification(subscription, person.name).catch(console.error)
        }
        // Call the onMatch callback if provided
        if (onMatch) {
          setTimeout(onMatch, 100)
        }
      }
      
      return matched ? "match" : "pending"
    },
    [],
  )

  const pass = useCallback((id: string) => {
    const current = snapshot.data
    if (current.blocked.includes(id)) return
    const likeSentAt = { ...current.likeSentAt }
    delete likeSentAt[id]
    const decisions = { ...current.decisions, [id]: "pass" as const }
    const added = current.decisions[id] === undefined
    if (added) editDeck(id)
    rememberDecisions(decisions, tallyDecisions(current.decisions) + (added ? 1 : 0))
    commit({
      ...current,
      decisions,
      likeSentAt,
    })
  }, [])

  const block = useCallback(
    (id: string) => {
      const current = snapshot.data
      if (current.blocked.includes(id)) return
      stopReply(id)
      const released = releasePerson(current, id)
      rememberDecisions(
        released.decisions,
        tallyDecisions(current.decisions) - (released.hadDecision ? 1 : 0),
      )
      deckEpoch++
      commit({
        ...current,
        blocked: [...current.blocked, id],
        decisions: released.decisions,
        messages: released.messages,
        openedChats: released.openedChats,
        likeSentAt: released.likeSentAt,
      })
    },
    [stopReply],
  )

  const returnToDeck = useCallback(
    (id: string) => {
      const current = snapshot.data
      if (current.blocked.includes(id)) return
      stopReply(id)
      const released = releasePerson(current, id)
      if (released.hadDecision) {
        rememberDecisions(released.decisions, tallyDecisions(current.decisions) - 1)
      }
      deckEpoch++
      commit({
        ...current,
        decisions: released.decisions,
        messages: released.messages,
        openedChats: released.openedChats,
        likeSentAt: released.likeSentAt,
      })
    },
    [stopReply],
  )

  const send = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim()
      const person = findCachedPerson(id)
      if (!trimmed || !person) return

      const current = snapshot.data
      if (current.blocked.includes(id) || current.decisions[id] !== "like") return
      const thread = current.messages[id] ?? []
      const sentCount = thread.filter((message) => message.from === "me").length
      const incoming = person.replies[sentCount]

      commit({
        ...current,
        openedChats: current.openedChats.includes(id)
          ? current.openedChats
          : [...current.openedChats, id],
        messages: {
          ...current.messages,
          [id]: [
            ...thread,
            {
              id: `${id}-${Date.now()}`,
              from: "me",
              text: trimmed,
              at: Date.now(),
            },
          ],
        },
      })
      
      // Sync message to Supabase in background
      if (isSupabaseConfigured()) {
        syncMessageToSupabase(id, trimmed).catch(err => {
          console.error('[Supabase] Message sync failed:', err)
        })
      }

      if (!incoming) return
      clearReply()
      replyFor.current = id
      setTypingId(id)
      replyTimer.current = window.setTimeout(() => {
        const latest = snapshot.data
        replyTimer.current = null
        replyFor.current = null
        if (latest.blocked.includes(id) || latest.decisions[id] !== "like") {
          setTypingId(null)
          return
        }
        commit({
          ...latest,
          messages: {
            ...latest.messages,
            [id]: [
              ...(latest.messages[id] ?? []),
              {
                id: `${id}-reply-${Date.now()}`,
                from: "them",
                text: incoming,
                at: Date.now(),
              },
            ],
          },
        })
        setTypingId(null)
        void pushNotice({
          title: person.name,
          body: incoming,
          url: `/chat/${id}`,
        })
      }, 900)
    },
    [clearReply],
  )

  const openChat = useCallback((id: string) => {
    const current = snapshot.data
    if (current.blocked.includes(id) || current.openedChats.includes(id)) return
    commit({ ...current, openedChats: [...current.openedChats, id] })
  }, [])

  const updateMe = useCallback((profile: Profile) => {
    commit({ ...snapshot.data, me: normalizeProfile(profile) })
  }, [])

  const setAttractedTo = useCallback((attractedTo: Attraction) => {
    if (!isAttraction(attractedTo) || snapshot.data.me.attractedTo === attractedTo) return
    commit({
      ...snapshot.data,
      me: normalizeProfile({ ...snapshot.data.me, attractedTo }),
    })
  }, [])

  const setDistanceKm = useCallback((distanceKm: number) => {
    const next = clampDistance(distanceKm)
    if (snapshot.data.me.distanceKm === next) return
    commit({
      ...snapshot.data,
      me: normalizeProfile({ ...snapshot.data.me, distanceKm: next }),
    })
  }, [])

  const restorePassed = useCallback(() => {
    const decisions = { ...snapshot.data.decisions }
    for (const [id, decision] of Object.entries(decisions)) {
      if (decision === "pass") delete decisions[id]
    }
    deckEpoch++
    commit({ ...snapshot.data, decisions })
  }, [])

  const reset = useCallback(() => {
    clearReply()
    void clearMyBlocks()
    deckEpoch++
    commit(
      {
        me: blankProfile,
        decisions: {},
        messages: {},
        openedChats: [],
        likesSent: 0,
        freeResetAt: null,
        unlimitedUntil: null,
        likeSentAt: {},
        blocked: [],
      },
      null,
    )
  }, [clearReply])

  const unlockDay = useCallback(() => {
    commit(
      { ...snapshot.data, unlimitedUntil: dayPassUntil(Date.now()) },
      "Rajattomat tykkäykset ovat käyttöösi vuorokaudeksi.",
    )
  }, [])

  const confirmLiveMatch = useCallback((id: string) => {
    const current = snapshot.data
    const likeSentAt = { ...current.likeSentAt }
    delete likeSentAt[id]
    commit({ ...current, likeSentAt })
  }, [])

  const value = useMemo<StoreValue>(() => {
    const { data } = snap
    const view = viewFor(data)
    const { deck, matches, pending, passedCount } = view
    const now = Date.now()
    const likesLocked = data.likesSent >= FREE_LIKES && (data.unlimitedUntil ?? 0) <= now && (!data.freeResetAt || data.freeResetAt > now)

    return {
      ready: snap.ready,
      notice: snap.notice,
      dismissNotice,
      me: data.me,
      deck,
      matches,
      pending,
      passedCount,
      filteredCount: view.unseen - deck.length,
      typingId,
      messagesFor: (id: string) => (data.blocked.includes(id) ? [] : (data.messages[id] ?? [])),
      openedChatIds: data.openedChats,
      openChat,
      like,
      pass,
      block,
      blocked: data.blocked,
      decisions: data.decisions,
      returnToDeck,
      send,
      updateMe,
      setAttractedTo,
      setDistanceKm,
      restorePassed,
      reset,
      likesLocked,
      freeResetAt: data.freeResetAt,
      unlimitedUntil: data.unlimitedUntil,
      unlockDay,
      likeSentAt: data.likeSentAt,
      confirmLiveMatch,
    }
  }, [snap, typingId, like, pass, block, returnToDeck, send, openChat, updateMe, setAttractedTo, setDistanceKm, restorePassed, reset, unlockDay, confirmLiveMatch])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function usePartner() {
  const value = useContext(StoreContext)
  if (!value) throw new Error("usePartner täytyy kutsua PartnerProviderin sisällä")
  return value
}
