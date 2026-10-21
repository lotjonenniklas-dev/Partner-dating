import * as ImageManipulator from "expo-image-manipulator"
import * as ImagePicker from "expo-image-picker"
import { useEffect, useRef, useState } from "react"
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { DualSlider, SingleSlider } from "../../components/sliders"
import { knownCity } from "../../lib/distance"
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
  ownGenderOptions,
  sexualityOptions,
  type Sexuality,
} from "../../lib/profile"
import { usePartner, type Profile } from "../../lib/store"
import { colors } from "../../theme"

function movePhoto(photos: string[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return photos
  const next = photos.slice()
  const [photo] = next.splice(from, 1)
  next.splice(to, 0, photo)
  return next
}

function parseInterests(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)
}

export default function ProfileScreen() {
  const { ready, me, updateMe, setAttractedTo, setDistanceKm, reset, notice, dismissNotice } = usePartner()
  const [profile, setProfile] = useState(me)
  const [interestText, setInterestText] = useState(me.interests.join(", "))
  const [ageText, setAgeText] = useState(String(me.age))
  const [heightText, setHeightText] = useState(me.heightCm == null ? "" : String(me.heightCm))
  const [error, setError] = useState<string | null>(null)
  const [photoAt, setPhotoAt] = useState<number | null>(null)
  const hydrated = useRef(false)
  const rowBox = useRef({ x: 0, width: 1 })
  const dragFrom = useRef<number | null>(null)

  useEffect(() => {
    if (!ready || hydrated.current) return
    hydrated.current = true
    setProfile(me)
    setInterestText(me.interests.join(", "))
    setAgeText(String(me.age))
    setHeightText(me.heightCm == null ? "" : String(me.heightCm))
  }, [ready, me])

  const canSave = useRef(false)
  const meRef = useRef(me)
  meRef.current = me
  useEffect(() => {
    if (!ready || !hydrated.current) return
    if (!canSave.current) {
      canSave.current = true
      return
    }
    const timer = setTimeout(() => {
      const age = Number(ageText)
      const ageOk = ageText !== "" && Number.isFinite(age) && age >= 18 && age <= AGE_MAX
      const parsedHeight = heightText === "" ? null : Number(heightText)
      const heightOk =
        parsedHeight == null || parsedHeight > 0
      const base = meRef.current
      const next: Profile = {
        ...profile,
        name: profile.name.trim(),
        age: ageOk ? age : base.age,
        city: profile.city.trim(),
        bio: profile.bio.trim(),
        interests: parseInterests(interestText),
        heightCm: heightOk ? parsedHeight : base.heightCm,
        photos: profile.photos.slice(0, PHOTO_MAX),
      }
      const unchanged =
        next.name === base.name &&
        next.age === base.age &&
        next.city === base.city &&
        next.bio === base.bio &&
        next.gender === base.gender &&
        next.sexuality === base.sexuality &&
        next.attractedTo === base.attractedTo &&
        next.ageMin === base.ageMin &&
        next.ageMax === base.ageMax &&
        next.distanceKm === base.distanceKm &&
        next.heightCm === base.heightCm &&
        next.interests.join("\u0000") === base.interests.join("\u0000") &&
        next.photos.join("\u0000") === base.photos.join("\u0000")
      if (!unchanged) updateMe(next)
      if (!heightOk && (heightText.length === 3 || (heightText.length === 2 && Number(heightText) < 12))) {
        setError("Pituus on 120–230 cm.")
      } else if (ageText.length >= 2 && !ageOk) {
        setError("Ikä on 18–100.")
      } else {
        setError(null)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [ready, profile, ageText, interestText, heightText, updateMe])

  const [adding, setAdding] = useState<string | null>(null)

  async function addPhotos() {
    if (adding) return
    const room = PHOTO_MAX - profile.photos.length
    if (room <= 0) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: room,
      quality: 0.6,
      exif: false,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    })
    if (result.canceled || result.assets.length === 0) return
    const assets = result.assets.slice(0, room)
    const photos = [...profile.photos]
    setAdding(`Lisätään kuvaa 1/${assets.length}`)
    for (let index = 0; index < assets.length; index += 1) {
      const asset = assets[index]
      if (photos.length >= PHOTO_MAX) break
      setAdding(`Lisätään kuvaa ${index + 1}/${assets.length}`)
      const saved = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 960 } }],
        { compress: 0.62, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      )
      if (saved.base64) {
        photos.push(`data:image/jpeg;base64,${saved.base64}`)
        setProfile((current) => ({ ...current, photos: photos.slice() }))
      }
    }
    setAdding(null)
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {notice ? (
          <Pressable onPress={dismissNotice} style={styles.notice}>
            <Text>{notice}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>Profiili</Text>
        <Text style={styles.summary}>
          {profile.name || "Nimi"}, {ageText || "ikä"} · {profile.city || "kaupunki"}
          {profile.heightCm ? ` · ${profile.heightCm} cm` : ""}
        </Text>
        <Text style={styles.summary}>
          {profile.gender ? `${ownGenderOptions.find((option) => option.value === profile.gender)?.label} · ` : ""}
          {attractionLabel(profile.attractedTo)} · {profile.ageMin}–{profile.ageMax} v · {profile.distanceKm} km
        </Text>

        <Text style={styles.label}>Kuvat</Text>
        <Text style={styles.hint}>
          {adding ?? `${profile.photos.length}/${PHOTO_MAX}. Kerralla enintään kuusi kuvaa. Siirrä kuvaa sormella. Sama järjestys näkyy profiilikortilla. Ensimmäinen on kansikuva.`}
        </Text>
        <View
          style={styles.photoRow}
          onLayout={(event) => {
            event.currentTarget.measureInWindow((x, _y, width) => {
              rowBox.current = { x, width }
            })
          }}
        >
          {Array.from({ length: PHOTO_MAX }, (_, index) => {
            const photo = profile.photos[index]
            if (!photo) {
              return (
                <Pressable
                  key={`empty-${index}`}
                  style={styles.empty}
                  disabled={adding !== null}
                  onPress={addPhotos}
                  accessibilityLabel={`Lisää kuva, paikka ${index + 1}`}
                >
                  <Text style={styles.addText}>{adding ? "…" : "+"}</Text>
                </Pressable>
              )
            }
            return (
              <View
                key={`${index}-${photo.slice(0, 24)}`}
                style={styles.slot}
                onMoveShouldSetResponderCapture={(_event: unknown, gesture?: { dx: number; dy: number }) =>
                  !!gesture &&
                  profile.photos.length > 1 &&
                  Math.abs(gesture.dx) > 10 &&
                  Math.abs(gesture.dx) > Math.abs(gesture.dy)
                }
                onResponderGrant={() => {
                  dragFrom.current = index
                }}
                onResponderRelease={(event) => {
                  const from = dragFrom.current
                  dragFrom.current = null
                  if (from == null) return
                  const { x, width } = rowBox.current
                  const raw = Math.floor(((event.nativeEvent.pageX - x) / width) * PHOTO_MAX)
                  const to = Math.max(0, Math.min(profile.photos.length - 1, raw))
                  if (to === from) return
                  setProfile((current) => ({ ...current, photos: movePhoto(current.photos, from, to) }))
                }}
              >
                <Pressable style={{ flex: 1 }} onPress={() => setPhotoAt(index)} accessibilityLabel={`Avaa kuva ${index + 1}`}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPhotoAt(null)
                    setProfile((current) => ({
                      ...current,
                      photos: current.photos.filter((_, photoIndex) => photoIndex !== index),
                    }))
                  }}
                  hitSlop={14}
                  style={styles.removeHit}
                  accessibilityLabel={`Poista kuva ${index + 1}`}
                >
                  <Text style={styles.remove}>×</Text>
                </Pressable>
              </View>
            )
          })}
        </View>

        <Field label="Nimi" value={profile.name} onChangeText={(name) => { setProfile((c) => ({ ...c, name })) }} />
        <Field label="Ikä" value={ageText} keyboardType="number-pad" onChangeText={(value) => { setAgeText(value.replace(/[^\d]/g, "").slice(0, 3)) }} />
        <Field label="Kaupunki" value={profile.city} onChangeText={(city) => { setProfile((c) => ({ ...c, city })) }} />
        <Field
          label="Pituus (cm)"
          value={heightText}
          keyboardType="number-pad"
          onChangeText={(value) => {
            const digits = value.replace(/\D/g, "").slice(0, 3)
            if (digits === "" && value !== "") return
            setHeightText(digits)
            const parsed = digits === "" ? null : Number(digits)
            const ok = parsed == null || parsed > 0
            if (!ok) return
            setProfile((current) => ({ ...current, heightCm: parsed }))
          }}
        />
        <Text style={styles.hint}>Senttimetreinä. Voit jättää tyhjäksi.</Text>
        {profile.city.trim() && !knownCity(profile.city) ? (
          <Text style={styles.hint}>Tätä kaupunkia ei tunnisteta, joten etäisyys ei rajaa hakua.</Text>
        ) : null}
        <Text style={styles.label}>Esittely</Text>
        <TextInput
          value={profile.bio}
          multiline
          maxLength={240}
          onChangeText={(bio) => { setProfile((c) => ({ ...c, bio })) }}
          style={[styles.input, styles.area]}
        />
        <Text style={styles.hint}>{profile.bio.length}/240</Text>
        <Text style={styles.label}>Kiinnostukset</Text>
        {parseInterests(interestText).length > 0 && (
          <View style={[styles.chips, { marginBottom: 12 }]}>
            {parseInterests(interestText).map((interest) => (
              <Chip
                key={interest}
                label={`${interest} ×`}
                selected={true}
                onPress={() => {
                  const newInterests = parseInterests(interestText).filter(
                    (i) => i.toLowerCase() !== interest.toLowerCase()
                  )
                  const text = newInterests.join(", ")
                  setInterestText(text)
                  setProfile((current) => ({ ...current, interests: newInterests }))
                }}
              />
            ))}
          </View>
        )}
        {[
          { label: "☕ Lifestyle", items: ["Kahvi", "Kävely", "Sauna", "Ruoka", "Leipominen", "Ruoanlaitto"] },
          { label: "🎨 Kulttuuri", items: ["Elokuvat", "Musiikki", "Taide", "Kirjat", "Teatteri", "Konsertit"] },
          { label: "⚡ Aktiviteetit", items: ["Urheilu", "Pyöräily", "Uinti", "Kuntosali", "Jooga", "Retkeily"] },
          { label: "🌿 Harrastukset", items: ["Valokuvaus", "Luonto", "Matkailu", "Kirpputorit", "Pelaaminen", "Tanssi"] },
        ].map((category) => (
          <View key={category.label} style={{ marginBottom: 12 }}>
            <Text style={[styles.hint, { marginBottom: 6 }]}>{category.label}</Text>
            <View style={styles.chips}>
              {category.items.map((interest) => {
                const selected = parseInterests(interestText).some((i) => i.toLowerCase() === interest.toLowerCase())
                return (
                  <Chip
                    key={interest}
                    label={interest}
                    selected={selected}
                    onPress={() => {
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
                      setProfile((current) => ({ ...current, interests: newInterests }))
                    }}
                  />
                )
              })}
            </View>
          </View>
        ))}
        <Field label="" value={interestText} placeholder="Tai kirjoita oma" onChangeText={(value) => { setInterestText(value) }} />
        <Text style={styles.hint}>Valitse tai kirjoita, enintään kuusi.</Text>

        <Text style={styles.label}>Sukupuoli</Text>
        <View style={styles.chips}>
          {ownGenderOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={profile.gender === option.value}
              onPress={() => {
                setProfile((current) => ({ ...current, gender: option.value }))
              }}
            />
          ))}
        </View>
        <Text style={styles.label}>Kiinnostunut</Text>
        <View style={styles.chips}>
          {attractionOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={profile.attractedTo === option.value}
              onPress={() => {
                setProfile((current) => ({ ...current, attractedTo: option.value }))
                setAttractedTo(option.value)
              }}
            />
          ))}
        </View>
        <Text style={styles.label}>Seksuaalisuus</Text>
        <View style={styles.chips}>
          {sexualityOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={profile.sexuality === option.value}
              onPress={() => {
                setProfile((current) => ({ ...current, sexuality: option.value as Sexuality }))
              }}
            />
          ))}
        </View>

        <View style={{ marginTop: 18 }}>
          <DualSlider
            label="Ikähaarukka"
            min={AGE_MIN}
            max={AGE_MAX}
            step={1}
            low={profile.ageMin}
            high={profile.ageMax}
            onChange={(ageMin, ageMax) => {
              setProfile((current) => ({ ...current, ageMin, ageMax }))
            }}
          />
        </View>
        <View style={{ marginTop: 18 }}>
          <SingleSlider
            label="Etäisyys"
            valueLabel={`${profile.distanceKm} km`}
            min={DISTANCE_MIN}
            max={DISTANCE_MAX}
            step={DISTANCE_STEP}
            value={profile.distanceKm}
            onChange={(distanceKm) => {
              setProfile((current) => ({ ...current, distanceKm }))
              setDistanceKm(distanceKm)
            }}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <Text style={[styles.label, { marginTop: 24 }]}>Tietojen hallinta</Text>
        
        <Pressable
          style={[styles.reset, { backgroundColor: "#ef4444", marginBottom: 12 }]}
          onPress={() =>
            Alert.alert(
              "⚠️ Poistetaanko tili pysyvästi?",
              "Tämä poistaa KAIKKI tietosi LOPULLISESTI. Tätä toimintoa EI VOI PERUA!",
              [
                { text: "Peruuta", style: "cancel" },
                {
                  text: "Poista",
                  style: "destructive",
                  onPress: () => {
                    reset()
                    setProfile((current) => ({
                      ...current,
                      name: "",
                      age: 0,
                      city: "",
                      bio: "",
                      interests: [],
                      gender: null,
                      sexuality: "hetero",
                      attractedTo: "molemmat",
                      ageMin: AGE_MIN,
                      ageMax: AGE_MAX,
                      distanceKm: DISTANCE_MAX,
                      heightCm: null,
                      photos: [],
                    }))
                    setInterestText("")
                    setAgeText("")
                    setHeightText("")
                    setError(null)
                    Alert.alert("Poistettu", "Kaikki tietosi on poistettu pysyvästi.")
                  }
                },
              ],
            )
          }
        >
          <Text style={[styles.resetText, { color: "white" }]}>🗑️ Poista</Text>
        </Pressable>

        <Pressable
          style={styles.reset}
          onPress={() =>
            Alert.alert(
              "Nollataanko tili?",
              "Profiilin tiedot, kuvat, osumat, keskustelut ja lähetetyt tykkäykset poistuvat. Tätä ei voi perua.",
              [
                { text: "Peruuta", style: "cancel" },
                {
                  text: "Nollaa",
                  style: "destructive",
                  onPress: () => {
                    reset()
                    setProfile((current) => ({
                      ...current,
                      name: "",
                      age: 0,
                      city: "",
                      bio: "",
                      interests: [],
                      gender: null,
                      sexuality: "hetero",
                      attractedTo: "molemmat",
                      ageMin: AGE_MIN,
                      ageMax: AGE_MAX,
                      distanceKm: DISTANCE_MAX,
                      heightCm: null,
                      photos: [],
                    }))
                    setInterestText("")
                    setAgeText("")
                    setHeightText("")
                    setError(null)
                  },
                },
              ],
            )
          }
        >
          <Text style={styles.resetText}>Nollaa</Text>
        </Pressable>
      </ScrollView>
      <Modal visible={photoAt !== null && profile.photos.length > 0} animationType="fade" onRequestClose={() => setPhotoAt(null)}>
        <SafeAreaView style={styles.viewer}>
          <View style={styles.viewerBar}>
            <View>
              <Text style={styles.viewerName}>{profile.name.trim() || "Profiili"}</Text>
              <Text style={styles.hint}>
                Kuva {(photoAt ?? 0) + 1} / {profile.photos.length}
              </Text>
            </View>
            <Pressable onPress={() => setPhotoAt(null)} hitSlop={8}>
              <Text style={styles.viewerClose}>Sulje</Text>
            </Pressable>
          </View>
          {profile.photos[photoAt ?? 0] ? (
            <Image source={{ uri: profile.photos[photoAt ?? 0] }} style={styles.viewerPhoto} resizeMode="contain" />
          ) : null}
          {profile.photos.length > 1 ? (
            <View style={styles.viewerNav}>
              <Pressable
                style={styles.navButton}
                onPress={() => setPhotoAt(((photoAt ?? 0) - 1 + profile.photos.length) % profile.photos.length)}
              >
                <Text style={styles.navText}>Edellinen</Text>
              </Pressable>
              <Pressable
                style={styles.navButton}
                onPress={() => setPhotoAt(((photoAt ?? 0) + 1) % profile.photos.length)}
              >
                <Text style={styles.navText}>Seuraava</Text>
              </Pressable>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  keyboardType?: "default" | "number-pad"
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} style={styles.input} />
    </View>
  )
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 48 },
  notice: { backgroundColor: colors.chip, borderRadius: 12, padding: 12, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: "700", color: colors.ink },
  sub: { marginTop: 8, color: colors.muted, lineHeight: 20 },
  summary: { marginTop: 6, color: colors.ink },
  label: { marginTop: 16, color: colors.ink, fontWeight: "700" },
  hint: { marginTop: 4, color: colors.muted, fontSize: 13 },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  area: { minHeight: 110, textAlignVertical: "top" },
  photoRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  slot: { flex: 1, aspectRatio: 3 / 4, position: "relative" },
  photo: { width: "100%", height: "100%", borderRadius: 6, backgroundColor: colors.chip },
  empty: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: colors.muted, fontSize: 18 },
  removeHit: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  remove: { color: colors.bg, fontSize: 16, lineHeight: 18 },
  viewer: { flex: 1, backgroundColor: colors.bg },
  viewerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewerName: { fontSize: 24, fontWeight: "600", color: colors.ink },
  viewerClose: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  viewerPhoto: { flex: 1, marginHorizontal: 16, borderRadius: 16 },
  viewerNav: { flexDirection: "row", gap: 8, padding: 16 },
  navButton: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: { color: colors.ink, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { backgroundColor: colors.chip, borderRadius: 999, paddingHorizontal: 14, minHeight: 44, justifyContent: "center" },
  chipOn: { backgroundColor: colors.primary },
  chipText: { color: colors.ink, fontWeight: "600" },
  chipTextOn: { color: colors.onPrimary },
  error: { marginTop: 12, color: "#8a3b3b" },
  reset: { marginTop: 12, height: 48, alignItems: "center", justifyContent: "center" },
  resetText: { color: colors.muted },
})
