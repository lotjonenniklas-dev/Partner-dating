import { distanceBetween } from "./distance"

export type Attraction = "miehet" | "naiset" | "molemmat"
export type Sexuality = "hetero" | "homo" | "bi" | "pan" | "aseksuaali" | "muu"
export type Gender = "mies" | "nainen"

export const attractionOptions: { value: Attraction; label: string }[] = [
  { value: "miehet", label: "Miehistä" },
  { value: "naiset", label: "Naisista" },
  { value: "molemmat", label: "Molemmista" },
]

export const sexualityOptions: { value: Sexuality; label: string }[] = [
  { value: "hetero", label: "Hetero" },
  { value: "homo", label: "Homoseksuaali" },
  { value: "bi", label: "Biseksuaali" },
  { value: "pan", label: "Panseksuaali" },
  { value: "aseksuaali", label: "Aseksuaali" },
  { value: "muu", label: "Muu" },
]

export const genderLabel: Record<Gender, string> = {
  mies: "Mies",
  nainen: "Nainen",
}

export type OwnGender = "mies" | "nainen" | "trans" | "muu"

export const ownGenderOptions: { value: OwnGender; label: string }[] = [
  { value: "mies", label: "Mies" },
  { value: "nainen", label: "Nainen" },
  { value: "trans", label: "Trans" },
  { value: "muu", label: "Muu" },
]

export function ownGenderLabel(value: OwnGender | null) {
  return ownGenderOptions.find((option) => option.value === value)?.label ?? ""
}

export function attractionLabel(value: Attraction) {
  return attractionOptions.find((option) => option.value === value)?.label ?? "Molemmista"
}

export function sexualityLabel(value: Sexuality) {
  return sexualityOptions.find((option) => option.value === value)?.label ?? "Muu"
}

export const AGE_MIN = 18
export const AGE_MAX = 100
export const DISTANCE_MIN = 5
export const DISTANCE_MAX = 600
export const DISTANCE_STEP = 5
export const PHOTO_MAX = 6
export const HEIGHT_MIN = 0
export const HEIGHT_MAX = 999

export function normalizeHeight(value: unknown): number | null {
  if (value == null || value === "") return null
  const number = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(number)) return null
  const cm = Math.round(number)
  if (cm < HEIGHT_MIN || cm > HEIGHT_MAX) return null
  return cm
}

export function fitsPreferences(
  person: { age: number; gender: Gender; city: string; attractedTo: Attraction },
  preferences: {
    attractedTo: Attraction
    gender: OwnGender | null
    ageMin: number
    ageMax: number
    city: string
    distanceKm: number
  },
) {
  if (person.age < preferences.ageMin || person.age > preferences.ageMax) return false
  if (preferences.attractedTo === "miehet" && person.gender !== "mies") return false
  if (preferences.attractedTo === "naiset" && person.gender !== "nainen") return false
  if (preferences.gender === "mies" && person.gender === "nainen" && person.attractedTo === "naiset") {
    return false
  }
  const km = distanceBetween(preferences.city, person.city)
  if (km != null && km > preferences.distanceKm) return false
  return true
}
