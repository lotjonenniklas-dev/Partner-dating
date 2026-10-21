import { router } from "expo-router"
import { useEffect, useRef, useState } from "react"
import {
  Alert,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Portrait } from "../../components/portrait"
import { distanceBetween } from "../../lib/distance"
import { compatibility } from "../../lib/match"
import { findPerson } from "../../lib/people"
import {
  attractionLabel,
  genderLabel,
  sexualityLabel,
} from "../../lib/profile"
import { usePartner } from "../../lib/store"
import { colors } from "../../theme"

export default function DiscoverScreen() {
  const {
    ready,
    me,
    deck,
    filteredCount,
    passedCount,
    likesLocked,
    like,
    pass,
    block,
    restorePassed,
    notice,
    dismissNotice,
  } = usePartner()
  const [matchId, setMatchId] = useState<string | null>(null)
  const [blockOpen, setBlockOpen] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const current = deck[0]
  const shownId = current?.id
  useEffect(() => {
    setBlockOpen(false)
  }, [shownId])
  const fit = current ? compatibility(current, me) : null
  const matched = matchId ? findPerson(matchId) : undefined
  const currentRef = useRef(current)
  const likeRef = useRef(like)
  const passRef = useRef(pass)
  const lockedRef = useRef(likesLocked)
  currentRef.current = current
  likeRef.current = like
  passRef.current = pass
  lockedRef.current = likesLocked

  const act = (direction: "like" | "pass") => {
    const person = currentRef.current
    if (!person || lockedRef.current) return
    if (direction === "pass") {
      passRef.current(person.id)
      return
    }
    const result = likeRef.current(person.id)
    if (result === "match") setMatchId(person.id)
  }

  const drag = useRef({ x: 0 })
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_event, gesture) => {
        drag.current.x = gesture.dx
      },
      onPanResponderRelease: () => {
        const dx = drag.current.x
        drag.current.x = 0
        if (dx > 72) act("like")
        else if (dx < -72) act("pass")
      },
    }),
  ).current

  const place =
    current == null
      ? ""
      : (() => {
          const km = distanceBetween(me.city, current.city)
          if (km == null || km === 0) return current.city
          return `${current.city} · ${km} km`
        })()

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {notice ? (
        <Pressable onPress={dismissNotice} style={styles.notice}>
          <Text style={styles.noticeText}>{notice}</Text>
        </Pressable>
      ) : null}
      {!likesLocked ? (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Tutustu</Text>
            <Text style={styles.sub}>{me.distanceKm} km</Text>
          </View>
          <Text style={styles.count}>
            {deck.length > 0 ? `${deck.length} jäljellä` : "Ei jäljellä"}
          </Text>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.body}>
        {!ready ? null : likesLocked ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Tykkäykset on nyt tältä päivältä lähetetty</Text>
            <Text style={styles.emptyBody}>
              Maksa 2,99 €, niin saat rajattomat tykkäykset käyttöösi vuorokaudeksi.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                Alert.alert(
                  "Google Pay",
                  "Maksa 2,99 €, niin saat rajattomat tykkäykset käyttöösi vuorokaudeksi.",
                )
              }}
            >
              <Text style={styles.primaryText}>Maksa Google Paylla</Text>
            </Pressable>
          </View>
        ) : current ? (
          <View {...pan.panHandlers}>
            <View style={styles.card}>
              <View style={styles.photoWrap}>
                <View style={styles.photo}>
                  <Portrait scene={current.scene} />
                </View>
                <View style={styles.cardMenu}>
                  <Pressable
                    style={styles.menuBtn}
                    accessibilityLabel="Kortin valikko"
                    onPress={() => setBlockOpen((open) => !open)}
                  >
                    <Text style={styles.menuGlyph}>···</Text>
                  </Pressable>
                  {blockOpen ? (
                    <Pressable
                      style={styles.blockBtn}
                      onPress={() => {
                        setBlockOpen(false)
                        setConfirmBlock(true)
                      }}
                    >
                      <Text style={styles.blockText}>Estä henkilö</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.name}>
                  {current.name}, {current.age}
                </Text>
                <Text style={styles.place}>{place}</Text>
                {fit ? (
                  <Text style={styles.fit}>
                    Yhteensopivuus {fit.score}
                    {"\n"}
                    {fit.reason}
                  </Text>
                ) : null}
                <Text style={styles.sexualityLine}>
                  <Text style={styles.meta}>Seksuaalisuus </Text>
                  {sexualityLabel(current.sexuality)}
                </Text>
                <Text style={styles.meta}>
                  {genderLabel[current.gender]} · Kiinnostunut{" "}
                  {attractionLabel(current.attractedTo).toLowerCase()}
                </Text>
                <Text style={styles.bio}>{current.bio}</Text>
                <View style={styles.tags}>
                  {current.interests.map((interest) => (
                    <View key={interest} style={styles.tag}>
                      <Text style={styles.tagText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.passBtn} onPress={() => act("pass")}>
                <Text style={styles.passText}>Ohita</Text>
              </Pressable>
              <Pressable style={styles.likeBtn} onPress={() => act("like")}>
                <Text style={styles.primaryText}>Tykkää</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Vedä korttia sivulle. Vasemmalle ohitat, oikealle tykkäät.</Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Rajaukseesi sopivat henkilöt loppuivat</Text>
            {filteredCount > 0 ? (
              <Pressable style={styles.primaryBtn} onPress={() => router.push("/profile")}>
                <Text style={styles.primaryText}>Muokkaa rajausta</Text>
              </Pressable>
            ) : passedCount > 0 ? (
              <Pressable style={styles.primaryBtn} onPress={restorePassed}>
                <Text style={styles.primaryText}>Palauta ohitetut</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.primaryBtn} onPress={() => router.push("/matches")}>
                <Text style={styles.primaryText}>Näytä osumat</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={confirmBlock} transparent animationType="fade" onRequestClose={() => setConfirmBlock(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Haluatko varmasti estää henkilön?</Text>
            <View style={styles.confirmRow}>
              <Pressable
                style={[styles.primaryBtn, styles.confirmBtn]}
                onPress={() => {
                  if (!current) return
                  setConfirmBlock(false)
                  block(current.id)
                }}
              >
                <Text style={styles.primaryText}>Kyllä</Text>
              </Pressable>
              <Pressable style={[styles.secondaryBtn, styles.confirmBtn]} onPress={() => setConfirmBlock(false)}>
                <Text style={styles.passText}>En</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(matched)} transparent animationType="fade" onRequestClose={() => setMatchId(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.kicker}>OSUMA</Text>
            <Text style={styles.modalTitle}>Sinä ja {matched?.name}</Text>
            <Text style={styles.emptyBody}>
              Te tykkäsitte toisistanne. {matched?.name} ehti jo jättää viestin.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                const id = matched?.id
                setMatchId(null)
                if (id) router.push(`/chat/${id}`)
              }}
            >
              <Text style={styles.primaryText}>Avaa keskustelu</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => setMatchId(null)}>
              <Text style={styles.passText}>Jatka</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  notice: { backgroundColor: colors.chip, paddingHorizontal: 16, paddingVertical: 10 },
  noticeText: { color: colors.ink, fontSize: 15, fontWeight: "500" },
  header: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 32, color: colors.ink, fontWeight: "700" },
  sub: { marginTop: 6, color: colors.muted, fontSize: 15, fontWeight: "500" },
  count: { color: colors.muted, fontSize: 15, fontWeight: "600", paddingTop: 8 },
  body: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  photoWrap: { position: "relative" },
  photo: { height: 520 },
  cardMenu: { position: "absolute", top: 12, right: 12, alignItems: "flex-end", gap: 8 },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuGlyph: { color: colors.ink, fontSize: 18, fontWeight: "700", letterSpacing: 1, marginTop: -4 },
  blockBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  blockText: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  name: { color: colors.ink, fontSize: 30, fontWeight: "700" },
  place: { color: colors.muted, marginTop: 4, fontSize: 15, fontWeight: "500" },
  fit: { color: colors.ink, marginTop: 10, fontSize: 15, fontWeight: "500", lineHeight: 21 },
  sexualityLine: { color: colors.ink, fontSize: 16, fontWeight: "500" },
  cardBody: { padding: 16, gap: 12 },
  meta: { color: colors.muted, fontSize: 13, fontWeight: "500", letterSpacing: 0.2 },
  bio: { color: colors.ink, fontSize: 16, fontWeight: "500", lineHeight: 23 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: colors.chip, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  passBtn: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  likeBtn: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  passText: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  primaryBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { textAlign: "center", color: colors.muted, fontSize: 13, fontWeight: "500", marginTop: 10 },
  empty: {
    marginTop: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 26, color: colors.ink, fontWeight: "700", textAlign: "center" },
  emptyBody: { marginTop: 8, color: colors.muted, fontSize: 16, fontWeight: "500", lineHeight: 23, textAlign: "center" },
  confirmRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  confirmBtn: { flex: 1, marginTop: 0 },
  modalBg: { flex: 1, backgroundColor: "rgba(18,28,45,0.45)", justifyContent: "center", padding: 24 },
  modal: { backgroundColor: "#fff", borderRadius: 18, padding: 22 },
  kicker: { color: colors.muted, letterSpacing: 1.6, fontSize: 12, fontWeight: "700" },
  modalTitle: { fontSize: 28, color: colors.ink, fontWeight: "700", marginTop: 6 },
})
