"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useGoogleAuth } from "@/lib/google-auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { NotificationSettings } from "@/components/notifications"
import { ProfilePhotos } from "@/components/profile-photos"
import { PhotoViewer } from "@/components/photo-viewer"
import { Monogram } from "@/components/portrait"
import { LocationPicker } from "@/components/location-picker"
import { ThemeSelector } from "@/components/theme-toggle"
import { cn } from "cn"
import { knownCity } from "@/lib/distance"
import type { Coordinates } from "@/lib/geolocation"
import {
  AGE_MAX,
  AGE_MIN,
  DISTANCE_MAX,
  DISTANCE_MIN,
  DISTANCE_STEP,
  HEIGHT_MAX,
  HEIGHT_MIN,
  PHOTO_MAX,
  attractionLabel,
  attractionOptions,
  ownGenderLabel,
  ownGenderOptions,
  sexualityLabel,
  sexualityOptions,
  type Attraction,
  type OwnGender,
  type Sexuality,
} from "@/lib/profile"
import { usePartner, type Profile } from "@/lib/store"

type Errors = Partial<
  Record<"name" | "age" | "city" | "bio" | "interests" | "ageMin" | "photos" | "gender" | "height", string>
>

function parseInterests(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)
}

function ageProblem(text: string) {
  if (text === "") return "Lisää ikä."
  const age = Number(text)
  if (!Number.isFinite(age) || age < 18 || age > AGE_MAX) return "Ikä on 18–100."
  return undefined
}

function heightProblem(raw: string) {
  if (raw === "") return undefined
  const height = Number(raw)
  if (!Number.isFinite(height) || height <= 0) {
    return "Syötä kelvollinen pituus."
  }
  return undefined
}

function heightDraftProblem(raw: string) {
  if (raw === "") return undefined
  const height = Number(raw)
  if (!Number.isFinite(height)) return "Syötä kelvollinen pituus."
  if (height <= 0) return "Syötä kelvollinen pituus."
  return undefined
}

function toStored(
  current: Profile,
  ageText: string,
  interestText: string,
  heightRaw: string,
  stored: Profile,
): Profile {
  const age = Number(ageText)
  const ageOk = ageText !== "" && Number.isFinite(age) && age >= 18 && age <= AGE_MAX
  const height = readHeight(heightRaw)
  const heightOk = height == null || height > 0
  return {
    ...current,
    name: current.name.trim(),
    city: current.city.trim(),
    bio: current.bio.trim(),
    age: ageOk ? age : stored.age,
    interests: parseInterests(interestText),
    heightCm: heightOk ? height : stored.heightCm,
    photos: (current.photos ?? []).slice(0, PHOTO_MAX),
  }
}

function sameEcho(stored: Profile, draft: Profile) {
  return (
    stored.name === draft.name &&
    stored.age === draft.age &&
    stored.city === draft.city &&
    stored.bio === draft.bio &&
    stored.gender === draft.gender &&
    stored.sexuality === draft.sexuality &&
    stored.attractedTo === draft.attractedTo &&
    stored.ageMin === draft.ageMin &&
    stored.ageMax === draft.ageMax &&
    stored.distanceKm === draft.distanceKm &&
    stored.heightCm === draft.heightCm &&
    stored.interests.join("\u0000") === draft.interests.join("\u0000") &&
    (stored.photos ?? []).join("\u0000") === (draft.photos ?? []).join("\u0000")
  )
}

function readHeight(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 3)
  if (digits === "") return null
  const height = Number(digits)
  return Number.isFinite(height) ? height : null
}

function holdHeightCaret(node: HTMLInputElement, place: number) {
  const apply = () => {
    if (document.activeElement !== node) return
    const pos = Math.max(0, Math.min(node.value.length, place))
    if (node.selectionStart === pos && node.selectionEnd === pos) return
    node.setSelectionRange(pos, pos)
  }
  apply()
  queueMicrotask(apply)
  window.requestAnimationFrame(apply)
  window.setTimeout(apply, 30)
}

export function ProfileForm() {
  const { me, updateMe, reset, notice } = usePartner()
  const { signOut } = useGoogleAuth()
  const [profile, setProfile] = useState(me)
  const [interestText, setInterestText] = useState(me.interests.join(", "))
  const [ageText, setAgeText] = useState(me.age > 0 ? String(me.age) : "")
  const [heightText, setHeightText] = useState(me.heightCm == null ? "" : String(me.heightCm))
  const [initialHeight] = useState(heightText)
  const [errors, setErrors] = useState<Errors>({})
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [photoAt, setPhotoAt] = useState<number | null>(null)
  const [storedMe, setStoredMe] = useState(me)
  const [echo, setEcho] = useState<Profile | null>(null)
  const heightRef = useRef<HTMLInputElement>(null)
  const heightDraft = useRef(heightText)
  const heightCaret = useRef(0)
  const draftRef = useRef({ profile, ageText, interestText })
  const meRef = useRef(me)
  const dirty = useRef(false)
  const saveTimer = useRef<number | null>(null)
  if (me !== storedMe) {
    const sameDetails =
      me.name === storedMe.name &&
      me.age === storedMe.age &&
      me.city === storedMe.city &&
      me.bio === storedMe.bio &&
      me.gender === storedMe.gender &&
      me.sexuality === storedMe.sexuality &&
      me.ageMin === storedMe.ageMin &&
      me.ageMax === storedMe.ageMax &&
      me.heightCm === storedMe.heightCm &&
      me.interests.join("\u0000") === storedMe.interests.join("\u0000")
    setStoredMe(me)
    if (echo && sameEcho(me, echo)) {
      setEcho(null)
    } else if (sameDetails) {
      setProfile((current) => ({
        ...current,
        attractedTo: me.attractedTo,
        distanceKm: me.distanceKm,
        photos: current.photos && current.photos.length > 0 ? current.photos : me.photos,
      }))
    } else {
      setProfile(me)
      setInterestText(me.interests.join(", "))
      setAgeText(me.age > 0 ? String(me.age) : "")
      setHeightText(me.heightCm == null ? "" : String(me.heightCm))
    }
  }

  useEffect(() => {
    const node = heightRef.current
    if (!node || document.activeElement === node) return
    heightDraft.current = heightText
    if (node.value !== heightText) node.value = heightText
  }, [heightText])

  useEffect(() => {
    meRef.current = me
    if (dirty.current) return
    const node = heightRef.current
    if (!node || document.activeElement !== node) heightDraft.current = heightText
    draftRef.current = { profile, ageText, interestText }
  }, [me, profile, ageText, interestText, heightText])

  function commit(next: Profile, age?: string, interests?: string, force = false) {
    const ageTextNow = age ?? draftRef.current.ageText
    const interestNow = interests ?? draftRef.current.interestText
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    draftRef.current = { profile: next, ageText: ageTextNow, interestText: interestNow }
    const stored = toStored(
      next,
      ageTextNow,
      interestNow,
      heightRef.current?.value ?? heightDraft.current,
      meRef.current,
    )
    console.log(`[ProfileForm.commit] stored.photos.length = ${stored.photos.length}, force = ${force}`)
    const heightFocused = heightRef.current != null && document.activeElement === heightRef.current
    if (!force && heightFocused) {
      console.log('[ProfileForm.commit] Skipping - height focused')
      dirty.current = true
      return
    }
    if (sameEcho(stored, meRef.current)) {
      console.log('[ProfileForm.commit] Skipping - sameEcho')
      dirty.current = false
      return
    }
    console.log('[ProfileForm.commit] Calling updateMe')
    dirty.current = false
    setEcho(stored)
    updateMe(stored)
    meRef.current = stored
  }

  function queue(next: Profile, age?: string, interests?: string) {
    const ageTextNow = age ?? draftRef.current.ageText
    const interestNow = interests ?? draftRef.current.interestText
    draftRef.current = { profile: next, ageText: ageTextNow, interestText: interestNow }
    dirty.current = true
    if (heightRef.current != null && document.activeElement === heightRef.current) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null
      const latest = draftRef.current
      commit(latest.profile, latest.ageText, latest.interestText)
    }, 300)
  }

  useLayoutEffect(() => {
    const node = heightRef.current
    if (!node || document.activeElement !== node) return
    const place = heightCaret.current
    const pos = Math.max(0, Math.min(node.value.length, place))
    if (node.selectionStart === pos && node.selectionEnd === pos) return
    node.setSelectionRange(pos, pos)
  })

  useEffect(() => {
    function flush() {
      if (!dirty.current) return
      const latest = draftRef.current
      const stored = toStored(
        latest.profile,
        latest.ageText,
        latest.interestText,
        heightRef.current?.value ?? heightDraft.current,
        meRef.current,
      )
      dirty.current = false
      if (sameEcho(stored, meRef.current)) return
      updateMe(stored)
      meRef.current = stored
    }
    function onHide() {
      if (document.visibilityState === "hidden") flush()
    }
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", flush)
    return () => {
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", flush)
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current)
        saveTimer.current = null
      }
      flush()
    }
  }, [updateMe])

  return (
    <div>
      <div className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
        <h1 className="font-heading text-[2rem] leading-none tracking-[-0.02em]">Profiili</h1>
        {notice && (
          <div className={`mt-4 rounded-lg p-4 text-sm ${notice.startsWith('✅') ? 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100'}`}>
            {notice}
          </div>
        )}
        <NotificationSettings />

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          {(profile.photos ?? [])[0] ? (
            <button
              type="button"
              onClick={() => setPhotoAt(0)}
              aria-label="Avaa kuvat"
              className="size-14 shrink-0 overflow-hidden rounded-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.photos[0]} alt="" className="size-full object-cover" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPhotoAt(0)}
              aria-label="Avaa kuva"
              className="size-14 shrink-0 cursor-pointer overflow-hidden rounded-md"
            >
              <Monogram name={profile.name || "P"} className="size-full rounded-md text-xl" />
            </button>
          )}
          <div>
            <p className="font-heading text-[1.65rem] leading-none tracking-[-0.02em]">
              {profile.name || "Nimi"}, {profile.age || "–"}
            </p>
            <p className="text-sm text-muted-foreground">{profile.city || "Kaupunki"}</p>
            <p className="text-sm text-muted-foreground">
              {profile.gender ? `${ownGenderLabel(profile.gender)} · ` : ""}
              {sexualityLabel(profile.sexuality)} · Kiinnostunut{" "}
              {attractionLabel(profile.attractedTo).toLowerCase()} · {profile.ageMin}–{profile.ageMax} v ·{" "}
              {profile.distanceKm} km
              {profile.heightCm ? ` · ${profile.heightCm} cm` : ""}
            </p>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            const latest = draftRef.current
            commit(latest.profile, latest.ageText, latest.interestText, true)
          }}
          className="mt-6 space-y-4"
          noValidate
        >
          <ProfilePhotos
            photos={profile.photos ?? []}
            error={errors.photos}
            onOpen={setPhotoAt}
            onChange={(photos) => {
              console.log(`[ProfileForm] onChange called with ${photos.length} photos`)
              const next = { ...draftRef.current.profile, photos: photos.slice(0, PHOTO_MAX) }
              console.log(`[ProfileForm] next.photos.length = ${next.photos.length}`)
              setPhotoAt(null)
              setProfile(next)
              commit(next, undefined, undefined, true)
            }}
          />
          <Field label="Nimi" error={errors.name} htmlFor="name">
            <Input
              id="name"
              value={profile.name}
              maxLength={32}
              onChange={(event) => {
                const next = { ...draftRef.current.profile, name: event.target.value }
                setProfile(next)
                queue(next)
              }}
              onBlur={(event) => {
                const name = event.currentTarget.value.trim()
                const next = { ...draftRef.current.profile, name }
                setProfile(next)
                setErrors((current) => ({ ...current, name: name ? undefined : "Lisää nimi." }))
                commit(next, undefined, undefined, true)
              }}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ikä" error={errors.age} htmlFor="age">
              <Input
                id="age"
                inputMode="numeric"
                autoComplete="off"
                value={ageText}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 3)
                  setAgeText(digits)
                  const age = Number(digits)
                  const next = {
                    ...draftRef.current.profile,
                    age: digits === "" || !Number.isFinite(age) ? 0 : age,
                  }
                  setProfile(next)
                  queue(next, digits)
                }}
                onBlur={(event) => {
                  const digits = event.currentTarget.value.replace(/\D/g, "").slice(0, 3)
                  setAgeText(digits)
                  setErrors((current) => ({ ...current, age: ageProblem(digits) }))
                  commit(draftRef.current.profile, digits, undefined, true)
                }}
              />
            </Field>
            <Field label="Kaupunki" error={errors.city} htmlFor="city">
              <Input
                id="city"
                value={profile.city}
                maxLength={40}
                autoComplete="off"
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => {
                  const next = { ...draftRef.current.profile, city: event.target.value }
                  setProfile(next)
                  queue(next)
                }}
                onBlur={(event) => {
                  const city = event.currentTarget.value.trim()
                  const next = { ...draftRef.current.profile, city }
                  setProfile(next)
                  setErrors((current) => ({ ...current, city: city ? undefined : "Lisää kaupunki." }))
                  commit(next, undefined, undefined, true)
                }}
              />
              <div className="mt-3">
                <LocationPicker
                  currentCity={profile.city}
                  onLocationFound={(coords: Coordinates) => {
                    const next = {
                      ...draftRef.current.profile,
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                      city: profile.city || "GPS-sijainti",
                    }
                    setProfile(next)
                    commit(next, undefined, undefined, true)
                  }}
                />
              </div>
              {profile.latitude != null && profile.longitude != null && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                  ✓ GPS-sijainti käytössä (tarkka etäisyyslaskenta)
                </p>
              )}
            </Field>
          </div>
          <Field label="Pituus" error={errors.height} htmlFor="height">
            <div className="flex items-center gap-2">
              <input
                ref={heightRef}
                id="height"
                name="height-cm"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="done"
                maxLength={3}
                defaultValue={initialHeight}
                aria-invalid={errors.height ? true : undefined}
                className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 py-1 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                onFocus={(event) => {
                  const node = event.currentTarget
                  heightCaret.current = node.value.length
                  holdHeightCaret(node, heightCaret.current)
                }}
                onSelect={(event) => {
                  heightCaret.current = event.currentTarget.selectionStart ?? heightCaret.current
                }}
                onBlur={(event) => {
                  const digits = event.currentTarget.value.replace(/\D/g, "").slice(0, 3)
                  heightDraft.current = digits
                  setHeightText(digits)
                  const problem = heightProblem(digits)
                  setErrors((current) => ({ ...current, height: problem }))
                  const next = {
                    ...draftRef.current.profile,
                    heightCm: problem ? meRef.current.heightCm : readHeight(digits),
                  }
                  setProfile(next)
                  commit(next, undefined, undefined, true)
                }}
                onChange={(event) => {
                  const node = event.currentTarget
                  const raw = node.value
                  const prev = heightDraft.current
                  let digits = raw.replace(/\D/g, "").slice(0, 3)
                  if (digits === "" && raw !== "") {
                    digits = prev
                    node.value = prev
                    heightDraft.current = prev
                    heightCaret.current = prev.length
                    holdHeightCaret(node, prev.length)
                    return
                  }
                  let place = node.selectionStart ?? digits.length
                  if (digits !== raw) {
                    const cut = raw.slice(0, place).length - raw.slice(0, place).replace(/\D/g, "").length
                    place = Math.max(0, Math.min(digits.length, place - cut))
                    node.value = digits
                  } else if (place === 0 && digits.startsWith(prev) && digits.length > prev.length) {
                    place = digits.length
                  }
                  heightDraft.current = digits
                  heightCaret.current = place
                  dirty.current = true
                  holdHeightCaret(node, place)
                  if (saveTimer.current) window.clearTimeout(saveTimer.current)
                  saveTimer.current = window.setTimeout(() => {
                    saveTimer.current = null
                    const digits = heightDraft.current
                    setErrors((current) => ({ ...current, height: heightDraftProblem(digits) }))
                    const latest = draftRef.current
                    commit(latest.profile, latest.ageText, latest.interestText, true)
                  }, 400)
                }}
              />
              <span className="shrink-0 text-sm text-muted-foreground">cm</span>
            </div>
            <p className="text-xs text-muted-foreground">Senttimetreinä. Voit jättää tyhjäksi.</p>
          </Field>
          <Field label="Esittely" error={errors.bio} htmlFor="bio">
            <Textarea
              id="bio"
              value={profile.bio}
              maxLength={240}
              rows={4}
              onChange={(event) => {
                const next = { ...draftRef.current.profile, bio: event.target.value }
                setProfile(next)
                queue(next)
              }}
              onBlur={(event) => {
                const bio = event.currentTarget.value.trim()
                const next = { ...draftRef.current.profile, bio }
                setProfile(next)
                setErrors((current) => ({
                  ...current,
                  bio: bio ? undefined : "Kirjoita lyhyt esittely.",
                }))
                commit(next, undefined, undefined, true)
              }}
            />
            <p className="text-xs text-muted-foreground">{profile.bio.length}/240</p>
          </Field>
          <Choice
            label="Sukupuoli"
            value={profile.gender}
            options={ownGenderOptions}
            error={errors.gender}
            onChange={(gender) => {
              const next = { ...draftRef.current.profile, gender }
              setErrors((current) => ({ ...current, gender: undefined }))
              setProfile(next)
              commit(next, undefined, undefined, true)
            }}
          />
          <Choice
            label="Kiinnostunut"
            value={profile.attractedTo}
            options={attractionOptions}
            onChange={(attractedTo) => {
              const next = { ...draftRef.current.profile, attractedTo }
              setProfile(next)
              commit(next, undefined, undefined, true)
            }}
          />
          <Choice
            label="Seksuaalisuus"
            value={profile.sexuality}
            options={sexualityOptions}
            onChange={(sexuality) => {
              const next = { ...draftRef.current.profile, sexuality }
              setProfile(next)
              commit(next, undefined, undefined, true)
            }}
          />
          <div className="space-y-4">
            <AgeRange
              min={profile.ageMin}
              max={profile.ageMax}
              error={errors.ageMin}
              onChange={(ageMin, ageMax) => {
                const next = { ...draftRef.current.profile, ageMin, ageMax }
                setProfile(next)
                commit(next, undefined, undefined, true)
              }}
            />
            <DistanceRange
              value={profile.distanceKm}
              city={profile.city}
              onChange={(distanceKm) => {
                const next = { ...draftRef.current.profile, distanceKm }
                setProfile(next)
                commit(next, undefined, undefined, true)
              }}
            />
          </div>
          <Field label="Kiinnostukset" error={errors.interests} htmlFor="interests">
            {parseInterests(interestText).length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {parseInterests(interestText).map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => {
                      const newInterests = parseInterests(interestText).filter(
                        (i) => i.toLowerCase() !== interest.toLowerCase()
                      )
                      const text = newInterests.join(", ")
                      setInterestText(text)
                      setErrors((current) => ({
                        ...current,
                        interests: newInterests.length > 0 ? undefined : "Lisää ainakin yksi kiinnostus.",
                      }))
                      commit(draftRef.current.profile, draftRef.current.ageText, text, true)
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-opacity hover:opacity-80"
                  >
                    {interest}
                    <span className="text-xs opacity-70">×</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mb-3 space-y-3">
              {[
                { label: "☕ Lifestyle", items: ["Kahvi", "Kävely", "Sauna", "Ruoka", "Leipominen", "Ruoanlaitto"] },
                { label: "🎨 Kulttuuri", items: ["Elokuvat", "Musiikki", "Taide", "Kirjat", "Teatteri", "Konsertit"] },
                { label: "⚡ Aktiviteetit", items: ["Urheilu", "Pyöräily", "Uinti", "Kuntosali", "Jooga", "Retkeily"] },
                { label: "🌿 Harrastukset", items: ["Valokuvaus", "Luonto", "Matkailu", "Kirpputorit", "Pelaaminen", "Tanssi"] },
              ].map((category) => (
                <div key={category.label}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">{category.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {category.items.map((interest) => {
                      const selected = parseInterests(interestText).some(
                        (i) => i.toLowerCase() === interest.toLowerCase()
                      )
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => {
                            let newInterests: string[]
                            if (selected) {
                              newInterests = parseInterests(interestText).filter(
                                (i) => i.toLowerCase() !== interest.toLowerCase()
                              )
                            } else {
                              newInterests = [...parseInterests(interestText), interest]
                            }
                            const text = newInterests.join(", ")
                            setInterestText(text)
                            setErrors((current) => ({
                              ...current,
                              interests: newInterests.length > 0 ? undefined : "Lisää ainakin yksi kiinnostus.",
                            }))
                            commit(draftRef.current.profile, draftRef.current.ageText, text, true)
                          }}
                          className={`rounded-full border px-3 py-1 text-sm transition-all ${
                            selected
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-border bg-card hover:border-primary/30 hover:bg-accent"
                          }`}
                        >
                          {interest}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <Input
              id="interests"
              value={interestText}
              placeholder="Tai kirjoita oma kiinnostus ja paina Enter"
              onChange={(event) => {
                const text = event.target.value
                setInterestText(text)
                queue(draftRef.current.profile, undefined, text)
              }}
              onBlur={(event) => {
                const text = event.currentTarget.value
                const interests = parseInterests(text)
                setInterestText(text)
                setErrors((current) => ({
                  ...current,
                  interests: interests.length > 0 ? undefined : "Lisää ainakin yksi kiinnostus.",
                }))
                commit(draftRef.current.profile, draftRef.current.ageText, text, true)
              }}
            />
          </Field>

        </form>
        {photoAt !== null && (
          <PhotoViewer
            name={profile.name.trim() || "Profiili"}
            photos={(profile.photos ?? []).length > 0 ? profile.photos : undefined}
            monogram={(profile.photos ?? []).length > 0 ? undefined : profile.name || "P"}
            start={photoAt}
            onClose={() => setPhotoAt(null)}
          />
        )}

        <div className="mt-10 rounded-2xl border border-border p-4">
          <h2 className="font-medium">Ulkoasu</h2>
          <div className="mt-3">
            <ThemeSelector />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-destructive/50 bg-destructive/5 p-4">
          <h2 className="font-medium text-destructive">Poista</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Poistaa KAIKKI tietosi pysyvästi sekä laitteelta että palvelimelta. Viestit, matchit,
            tykkäykset ja kaikki muu data poistetaan lopullisesti. Tätä ei voi perua.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="mt-3 h-12 rounded-full px-5"
            onClick={() => setConfirmDelete(true)}
          >
            Poista
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <h2 className="font-medium text-amber-900 dark:text-amber-100">🔧 Tyhjennä välimuisti</h2>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Jos kuvat katoavat, selaimen välimuisti saattaa olla täynnä. Tämä tyhjentää kaiken datan ja lataa sivun uudelleen.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 h-12 rounded-full border-amber-300 px-5 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900"
            onClick={async () => {
              if (confirm("Tyhjennä KAIKKI data ja lataa sivu uudelleen?")) {
                localStorage.clear()
                sessionStorage.clear()
                // Clear IndexedDB
                const { clearAllPhotos } = await import("@/lib/indexed-storage")
                await clearAllPhotos()
                window.location.reload()
              }
            }}
          >
            Tyhjennä välimuisti
          </Button>
        </div>

        <div className="mt-6 rounded-2xl border border-border p-4">
          <h2 className="font-medium">Nollaa</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Poistaa nimen, esittelyn, kuvat, pituuden ja muut profiiliin laitetut tiedot. Osumat,
            keskustelut ja kaikki lähetetyt tykkäykset poistuvat.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 h-12 rounded-full px-5"
            onClick={() => setConfirmReset(true)}
          >
            Nollaa
          </Button>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          <Link href="/tietosuoja" className="underline underline-offset-4 hover:text-foreground">
            Tietosuoja
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/ehdot" className="underline underline-offset-4 hover:text-foreground">
            Käyttöehdot
          </Link>
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Kirjaudu ulos
        </button>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nollataanko tili?</DialogTitle>
            <DialogDescription>
              Profiilin tiedot, kuvat, osumat, keskustelut ja lähetetyt tykkäykset poistuvat. Tätä ei
              voi perua.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (saveTimer.current) {
                  window.clearTimeout(saveTimer.current)
                  saveTimer.current = null
                }
                dirty.current = false
                reset()
                setConfirmReset(false)
              }}
            >
              Nollaa
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmReset(false)}
            >
              Peruuta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">⚠️ Poistetaanko tili pysyvästi?</DialogTitle>
            <DialogDescription>
              Tämä poistaa KAIKKI tietosi LOPULLISESTI sekä tältä laitteelta että palvelimilta. Mukaan lukien:
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Profiili ja kuvat</li>
                <li>Kaikki viestit ja keskustelut</li>
                <li>Matchit ja tykkäykset</li>
                <li>Push-ilmoitusten tilaukset</li>
                <li>Tekemäsi raportit</li>
              </ul>
              <strong className="mt-2 block text-destructive">Tätä toimintoa EI VOI PERUA!</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={async () => {
                try {
                  const { deviceId } = await import("@/lib/directory-client")
                  
                  // Delete from server
                  const response = await fetch("/api/delete-account", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ deviceId }),
                  })

                  const result = await response.json()
                  
                  if (result.success) {
                    // Clear local data
                    if (saveTimer.current) {
                      window.clearTimeout(saveTimer.current)
                      saveTimer.current = null
                    }
                    dirty.current = false
                    reset()
                    
                    // Clear IndexedDB
                    if (typeof window !== "undefined" && "indexedDB" in window) {
                      indexedDB.deleteDatabase("partner")
                    }
                    
                    // Clear localStorage
                    localStorage.clear()
                    
                    setConfirmDelete(false)
                    alert("Tili poistettu pysyvästi. Sivun latautuminen uudelleen...")
                    window.location.href = "/"
                  } else {
                    alert("Tilin poisto epäonnistui: " + result.error)
                  }
                } catch (error) {
                  console.error("Delete account error:", error)
                  alert("Tilin poisto epäonnistui")
                }
              }}
            >
              Poista
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmDelete(false)}
            >
              Peruuta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function endLabelStyle(position: number, other: number, side: "min" | "max") {
  const close = Math.abs(position - other) < 0.12
  let transform = "translateX(-50%)"
  if (close) {
    transform = side === "min" ? "translateX(calc(-100% - 6px))" : "translateX(6px)"
  } else if (position < 0.04) {
    transform = "translateX(0)"
  } else if (position > 0.96) {
    transform = "translateX(-100%)"
  }
  return { left: `${position * 100}%`, transform }
}

function AgeRange({
  min,
  max,
  error,
  onChange,
}: {
  min: number
  max: number
  error?: string
  onChange: (min: number, max: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<{ other: number } | null>(null)
  const [active, setActive] = useState<"min" | "max" | null>(null)
  const span = AGE_MAX - AGE_MIN
  const ratio = (value: number) => (value - AGE_MIN) / span

  function read(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return min
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return Math.round(AGE_MIN + t * span)
  }

  function nearest(value: number): "min" | "max" {
    const toMin = Math.abs(value - min)
    const toMax = Math.abs(value - max)
    if (toMin < toMax) return "min"
    if (toMax < toMin) return "max"
    return "max"
  }

  function begin(which: "min" | "max", event: React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    dragging.current = { other: which === "min" ? max : min }
    setActive(which)
    const pointerId = event.pointerId
    const handle = event.currentTarget
    try {
      handle.setPointerCapture(pointerId)
    } catch {
      // Pointer capture can fail if the press was already released.
    }
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId || !dragging.current) return
      moveTo(read(ev.clientX))
    }
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      dragging.current = null
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  function moveTo(value: number) {
    const drag = dragging.current
    if (!drag) return
    const next = Math.min(AGE_MAX, Math.max(AGE_MIN, value))
    onChange(Math.min(next, drag.other), Math.max(next, drag.other))
  }

  function onTrackDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    const value = read(event.clientX)
    begin(nearest(value), event)
    moveTo(value)
  }

  function onThumbDown(event: React.PointerEvent<HTMLButtonElement>, which: "min" | "max") {
    let target = which
    if (min === max) {
      const rect = event.currentTarget.getBoundingClientRect()
      target = event.clientX <= rect.left + rect.width / 2 ? "min" : "max"
    }
    begin(target, event)
  }

  function onKeyDown(event: React.KeyboardEvent, which: "min" | "max") {
    const current = which === "min" ? min : max
    const step = event.shiftKey ? 5 : 1
    let next = current
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = current + step
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = current - step
    else if (event.key === "PageUp") next = current + 5
    else if (event.key === "PageDown") next = current - 5
    else if (event.key === "Home") next = AGE_MIN
    else if (event.key === "End") next = AGE_MAX
    else return
    event.preventDefault()
    const clamped = Math.min(AGE_MAX, Math.max(AGE_MIN, next))
    if (which === "min") onChange(Math.min(clamped, max), max)
    else onChange(min, Math.max(clamped, min))
  }

  return (
    <div className="space-y-1.5">
      <p id="age-range-label" className="text-sm font-medium">
        Ikähaarukka
      </p>
      <div className="pt-2 pb-1">
        <div className="mx-4">
          <div
            ref={trackRef}
            className="relative h-12 touch-none select-none"
            onPointerDown={onTrackDown}
          >
            <div className="pointer-events-none absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-secondary" />
            <div
              className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
              style={{
                left: `${ratio(min) * 100}%`,
                width: `${(ratio(max) - ratio(min)) * 100}%`,
              }}
            />
            <Thumb
              label="Alaikäraja"
              value={min}
              min={AGE_MIN}
              max={AGE_MAX}
              valueText={`${min} vuotta`}
              labelledBy="age-range-label"
              position={ratio(min)}
              active={active === "min"}
              onPointerDown={(event) => onThumbDown(event, "min")}
              onKeyDown={(event) => onKeyDown(event, "min")}
              onFocus={() => setActive("min")}
            />
            <Thumb
              label="Yläikäraja"
              value={max}
              min={AGE_MIN}
              max={AGE_MAX}
              valueText={`${max} vuotta`}
              labelledBy="age-range-label"
              position={ratio(max)}
              active={active === "max" || active === null}
              onPointerDown={(event) => onThumbDown(event, "max")}
              onKeyDown={(event) => onKeyDown(event, "max")}
              onFocus={() => setActive("max")}
            />
          </div>
          <div className="relative mt-1 h-4">
            <span
              className="pointer-events-none absolute text-xs text-muted-foreground tabular-nums"
              style={endLabelStyle(ratio(min), ratio(max), "min")}
            >
              {min}
            </span>
            {min !== max && (
              <span
                className="pointer-events-none absolute text-xs text-muted-foreground tabular-nums"
                style={endLabelStyle(ratio(max), ratio(min), "max")}
              >
                {max}
              </span>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function DistanceRange({
  value,
  city,
  onChange,
}: {
  value: number
  city: string
  onChange: (value: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const span = DISTANCE_MAX - DISTANCE_MIN
  const ratio = (next: number) => (next - DISTANCE_MIN) / span

  function snap(next: number) {
    const clamped = Math.min(DISTANCE_MAX, Math.max(DISTANCE_MIN, next))
    const steps = Math.round((clamped - DISTANCE_MIN) / DISTANCE_STEP)
    return DISTANCE_MIN + steps * DISTANCE_STEP
  }

  function read(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return value
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return snap(DISTANCE_MIN + t * span)
  }

  function begin(event: React.PointerEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    dragging.current = true
    const pointerId = event.pointerId
    const handle = event.currentTarget
    try {
      handle.setPointerCapture(pointerId)
    } catch {
      // Pointer capture can fail if the press was already released.
    }
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId || !dragging.current) return
      onChange(read(ev.clientX))
    }
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      dragging.current = false
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  function onTrackDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    onChange(read(event.clientX))
    begin(event)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const step = event.shiftKey ? DISTANCE_STEP * 5 : DISTANCE_STEP
    let next = value
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = value + step
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = value - step
    else if (event.key === "PageUp") next = value + DISTANCE_STEP * 5
    else if (event.key === "PageDown") next = value - DISTANCE_STEP * 5
    else if (event.key === "Home") next = DISTANCE_MIN
    else if (event.key === "End") next = DISTANCE_MAX
    else return
    event.preventDefault()
    onChange(snap(next))
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p id="distance-label" className="text-sm font-medium">
          Etäisyys
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">{value} km</p>
      </div>
      <div className="pt-2 pb-1">
        <div className="mx-4">
          <div
            ref={trackRef}
            className="relative h-12 touch-none select-none"
            onPointerDown={onTrackDown}
          >
            <div className="pointer-events-none absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-secondary" />
            <div
              className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
              style={{ width: `${ratio(value) * 100}%` }}
            />
            <Thumb
              label="Etäisyys"
              value={value}
              min={DISTANCE_MIN}
              max={DISTANCE_MAX}
              valueText={`${value} kilometriä`}
              labelledBy="distance-label"
              position={ratio(value)}
              active
              onPointerDown={begin}
              onKeyDown={onKeyDown}
              onFocus={() => {}}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{DISTANCE_MIN}</span>
            <span>{DISTANCE_MAX}</span>
          </div>
        </div>
      </div>
      {city.trim() && !knownCity(city) && (
        <p className="text-xs text-muted-foreground">
          Tätä kaupunkia ei tunnisteta, joten etäisyys ei rajaa hakua.
        </p>
      )}
    </div>
  )
}

function Thumb({
  label,
  value,
  min,
  max,
  valueText,
  labelledBy,
  position,
  active,
  onPointerDown,
  onKeyDown,
  onFocus,
}: {
  label: string
  value: number
  min: number
  max: number
  valueText: string
  labelledBy: string
  position: number
  active: boolean
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  onFocus: () => void
}) {
  return (
    <button
      type="button"
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      aria-labelledby={labelledBy}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      className={cn(
        "absolute top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-[3px] border-primary bg-card shadow-sm active:cursor-grabbing",
        active ? "z-20" : "z-10",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      )}
      style={{ left: `${position * 100}%` }}
    />
  )
}

function Choice<T extends Attraction | Sexuality | OwnGender>({
  label,
  value,
  options,
  error,
  onChange,
}: {
  label: string
  value: T | null
  options: { value: T; label: string }[]
  error?: string
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-11 cursor-pointer touch-manipulation rounded-full px-4 py-2 text-sm transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </fieldset>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
