import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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
} from "./crowd"
import { readLikeSentAt, settleSentLikes } from "./like-ttl"
import { catalogIndex, findPerson, people, type Person } from "./people"
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
} from "./profile"

export type Profile = {
  name: string
  age: number
  city: string
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
  unlimitedUntil: number | null
  likeSentAt: Record<string, number>
  blocked: string[]
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
  like: (id: string) => "match" | "pending" | "limited"
  pass: (id: string) => void
  block: (id: string) => void
  blocked: string[]
  returnToDeck: (id: string) => void
  send: (id: string, text: string) => void
  updateMe: (profile: Profile) => void
  setAttractedTo: (attractedTo: Attraction) => void
  setDistanceKm: (distanceKm: number) => void
  restorePassed: () => void
  reset: () => void
  likesLocked: boolean
  unlockDay: () => void
  likeSentAt: Record<string, number>
}

const STORAGE_KEY = "partner-v1"
export const FREE_LIKES = 10
const DAY_MS = 24 * 60 * 60 * 1000

export const defaultProfile: Profile = {
  name: "Niklas",
  age: 29,
  city: "Helsinki",
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
  unlimitedUntil: null,
  likeSentAt: {},
  blocked: [],
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
  return Boolean(findPerson(id)?.likesYou)
}

function readStorage(raw: string | null): { data: Persisted; notice: string | null; persist: boolean } {
  try {
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
    const counted = Object.values(settled.decisions).filter((decision) => decision === "like").length
    const storedLikes =
      typeof parsed.likesSent === "number" && Number.isFinite(parsed.likesSent)
        ? Math.max(0, Math.floor(parsed.likesSent))
        : 0
    return {
      data: {
        me: normalizeProfile(parsed.me),
        decisions: settled.decisions,
        messages: parsed.messages,
        openedChats: normalizeOpened(parsed.openedChats, parsed.messages),
        likesSent: Math.max(storedLikes, counted),
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

const StoreContext = createContext<StoreValue | null>(null)

let mobileView: {
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

function passedIn(decisions: Persisted["decisions"]) {
  let passed = 0
  for (const id in decisions) if (decisions[id] === "pass") passed++
  return passed
}

function mobileViewFor(ranker: CatalogRanker<Person, Profile>, data: Persisted) {
  const order = ranker.order(data.me)
  if (
    mobileView &&
    mobileView.order === order &&
    mobileView.decisions === data.decisions &&
    mobileView.blocked === data.blocked
  ) {
    return mobileView
  }
  const deck = deckWindow.open(order, data.decisions, data.blocked, deckEpoch)
  const matches = likedInCatalogOrder(data.decisions, data.blocked, true, findPerson, catalogIndex)
  const pending = likedInCatalogOrder(data.decisions, data.blocked, false, findPerson, catalogIndex)
  const unseen = countUnseen(people.length, data.decisions, data.blocked)
  mobileView = {
    order,
    decisions: data.decisions,
    blocked: data.blocked,
    deck,
    matches,
    pending,
    unseen,
    passedCount: passedIn(data.decisions),
  }
  return mobileView
}

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Persisted>(emptyState)
  const [ready, setReady] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [typingId, setTypingId] = useState<string | null>(null)
  const dataRef = useRef(data)
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const replyFor = useRef<string | null>(null)
  const [rankTick, setRankTick] = useState(0)
  const rankerRef = useRef<CatalogRanker<Person, Profile> | null>(null)
  if (!rankerRef.current) {
    rankerRef.current = new CatalogRanker(people, fitsPreferences, () => {
      mobileView = null
      deckEpoch++
      setRankTick((value) => value + 1)
    })
  }
  dataRef.current = data

  const commit = useCallback((next: Persisted, nextNotice?: string | null) => {
    const messages = boundThreads(next.messages)
    const bounded = messages === next.messages ? next : { ...next, messages }
    dataRef.current = bounded
    setData(bounded)
    if (nextNotice !== undefined) setNotice(nextNotice)
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bounded)).catch(() => {
      setNotice("Muutoksia ei voitu tallentaa tähän puhelimeen.")
    })
  }, [])

  useEffect(() => {
    let cancel = false
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (cancel) return
      const stored = readStorage(raw)
      if (stored.persist) commit(stored.data, stored.notice)
      else {
        dataRef.current = stored.data
        setData(stored.data)
        setNotice(stored.notice)
      }
      setReady(true)
    })
    const expiryTimer = setInterval(() => {
      const settled = settleSentLikes(
        dataRef.current.decisions,
        dataRef.current.likeSentAt ?? {},
        Date.now(),
        isMatch,
      )
      if (!settled.changed) return
      deckEpoch++
      commit({
        ...dataRef.current,
        decisions: settled.decisions,
        likeSentAt: settled.likeSentAt,
      })
    }, 30_000)
    return () => {
      cancel = true
      clearInterval(expiryTimer)
      if (replyTimer.current) clearTimeout(replyTimer.current)
    }
  }, [commit])

  const clearReply = useCallback(() => {
    if (replyTimer.current) clearTimeout(replyTimer.current)
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
    (id: string) => {
      const current = dataRef.current
      if (current.blocked.includes(id)) return "pending"
      const unlimited = (current.unlimitedUntil ?? 0) > Date.now()
      const alreadyLiked = current.decisions[id] === "like"
      if (!unlimited && !alreadyLiked && current.likesSent >= FREE_LIKES) return "limited"

      const person = findPerson(id)
      const matched = Boolean(person?.likesYou)
      const messages = { ...current.messages }
      if (matched && person?.opener && !messages[id]?.length) {
        messages[id] = [
          { id: `${id}-opener`, from: "them", text: person.opener, at: Date.now() },
        ]
      }
      const likeSentAt = { ...current.likeSentAt }
      if (matched) delete likeSentAt[id]
      else if (!alreadyLiked || typeof likeSentAt[id] !== "number") likeSentAt[id] = Date.now()
      const decisions = { ...current.decisions, [id]: "like" as const }
      const added = current.decisions[id] === undefined
      if (added) editDeck(id)
      rememberDecisions(decisions, tallyDecisions(current.decisions) + (added ? 1 : 0))
      commit({
        ...current,
        decisions,
        messages,
        likesSent: alreadyLiked ? current.likesSent : current.likesSent + 1,
        likeSentAt,
      })
      return matched ? "match" : "pending"
    },
    [commit],
  )

  const pass = useCallback(
    (id: string) => {
      const current = dataRef.current
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
    },
    [commit],
  )

  const block = useCallback(
    (id: string) => {
      const current = dataRef.current
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
    [commit, stopReply],
  )

  const returnToDeck = useCallback(
    (id: string) => {
      const current = dataRef.current
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
    [commit, stopReply],
  )

  const send = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim()
      const person = findPerson(id)
      if (!trimmed || !person) return
      const current = dataRef.current
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
            { id: `${id}-${Date.now()}`, from: "me", text: trimmed, at: Date.now() },
          ],
        },
      })
      if (!incoming) return
      clearReply()
      replyFor.current = id
      setTypingId(id)
      replyTimer.current = setTimeout(() => {
        const latest = dataRef.current
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
      }, 900)
    },
    [clearReply, commit],
  )

  const openChat = useCallback(
    (id: string) => {
      if (dataRef.current.blocked.includes(id) || dataRef.current.openedChats.includes(id)) return
      commit({ ...dataRef.current, openedChats: [...dataRef.current.openedChats, id] })
    },
    [commit],
  )

  const updateMe = useCallback(
    (profile: Profile) => {
      commit({ ...dataRef.current, me: normalizeProfile(profile) })
    },
    [commit],
  )

  const setAttractedTo = useCallback(
    (attractedTo: Attraction) => {
      if (!isAttraction(attractedTo) || dataRef.current.me.attractedTo === attractedTo) return
      commit({
        ...dataRef.current,
        me: normalizeProfile({ ...dataRef.current.me, attractedTo }),
      })
    },
    [commit],
  )

  const setDistanceKm = useCallback(
    (distanceKm: number) => {
      const next = clampDistance(distanceKm)
      if (dataRef.current.me.distanceKm === next) return
      commit({
        ...dataRef.current,
        me: normalizeProfile({ ...dataRef.current.me, distanceKm: next }),
      })
    },
    [commit],
  )

  const restorePassed = useCallback(() => {
    const decisions = { ...dataRef.current.decisions }
    for (const [id, decision] of Object.entries(decisions)) {
      if (decision === "pass") delete decisions[id]
    }
    deckEpoch++
    commit({ ...dataRef.current, decisions })
  }, [commit])

  const reset = useCallback(() => {
    clearReply()
    deckEpoch++
    commit(
      {
        me: blankProfile,
        decisions: {},
        messages: {},
        openedChats: [],
        likesSent: 0,
        unlimitedUntil: null,
        likeSentAt: {},
        blocked: [],
      },
      null,
    )
  }, [clearReply, commit])

  const unlockDay = useCallback(() => {
    commit(
      { ...dataRef.current, unlimitedUntil: Date.now() + DAY_MS },
      "Rajattomat tykkäykset ovat käyttöösi vuorokaudeksi.",
    )
  }, [commit])

  const dismissNotice = useCallback(() => setNotice(null), [])

  const value = useMemo<StoreValue>(() => {
    const view = mobileViewFor(rankerRef.current!, data)
    const { deck, matches, pending, passedCount } = view
    const likesLocked = data.likesSent >= FREE_LIKES && (data.unlimitedUntil ?? 0) <= Date.now()
    return {
      ready,
      notice,
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
      returnToDeck,
      send,
      updateMe,
      setAttractedTo,
      setDistanceKm,
      restorePassed,
      reset,
      likesLocked,
      unlockDay,
      likeSentAt: data.likeSentAt ?? {},
    }
  }, [
    data,
    rankTick,
    ready,
    notice,
    typingId,
    dismissNotice,
    like,
    pass,
    block,
    returnToDeck,
    send,
    openChat,
    updateMe,
    setAttractedTo,
    setDistanceKm,
    restorePassed,
    reset,
    unlockDay,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function usePartner() {
  const value = useContext(StoreContext)
  if (!value) throw new Error("usePartner pitää olla PartnerProviderin sisällä")
  return value
}
