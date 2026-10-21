import AsyncStorage from "@react-native-async-storage/async-storage"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Portrait } from "../../components/portrait"
import { findPerson, personFrames } from "../../lib/people"
import { usePartner } from "../../lib/store"
import { validateMessage } from "../../lib/message-filter"
import { colors } from "../../theme"

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const personId = Array.isArray(id) ? id[0] : id
  const person = personId ? findPerson(personId) : undefined
  const { messagesFor, send, typingId, matches, block, blocked, returnToDeck } = usePartner()
  const [text, setText] = useState("")
  const [photoAt, setPhotoAt] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [reportDone, setReportDone] = useState(false)
  const messages = personId ? messagesFor(personId) : []
  const matched = Boolean(person && matches.some((match) => match.id === person.id))
  const hidden = Boolean(personId && blocked.includes(personId))
  const frames = person && matched ? personFrames(person) : []
  const openIndex = photoAt === null ? 0 : ((photoAt % Math.max(frames.length, 1)) + Math.max(frames.length, 1)) % Math.max(frames.length, 1)

  useEffect(() => {
    if (!hidden) return
    router.replace("/matches")
  }, [hidden])

  if (hidden) {
    return <SafeAreaView style={styles.screen} edges={["top", "bottom"]} />
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>Takaisin</Text>
        </Pressable>
        {frames.length > 0 && person ? (
          <Pressable style={styles.avatar} onPress={() => setPhotoAt(0)} accessibilityLabel={`Avaa kuvat, ${person.name}`}>
            <Portrait scene={person.scene} />
          </Pressable>
        ) : null}
        <Text style={styles.title}>{matched && person ? person.name : "Keskustelu"}</Text>
        {matched && personId ? (
          <View style={styles.menuWrap}>
            <Pressable
              accessibilityLabel="Keskustelun valikko"
              accessibilityState={{ expanded: menuOpen }}
              hitSlop={8}
              style={styles.menuBtn}
              onPress={() => setMenuOpen((open) => !open)}
            >
              <Text style={styles.menuGlyph}>···</Text>
            </Pressable>
            {menuOpen ? (
              <View style={styles.menuSheet}>
                <Pressable
                  style={styles.menuAction}
                  accessibilityLabel="Poista ja palauta kortti pinoon"
                  onPress={() => {
                    setMenuOpen(false)
                    setConfirmRemove(true)
                  }}
                >
                  <Text style={styles.menuActionText}>Poista</Text>
                </Pressable>
                <Pressable
                  style={styles.menuAction}
                  onPress={() => {
                    setMenuOpen(false)
                    setConfirmBlock(true)
                  }}
                >
                  <Text style={styles.menuActionText}>Estä henkilö</Text>
                </Pressable>
                <Pressable
                  style={styles.menuAction}
                  onPress={() => {
                    setMenuOpen(false)
                    setReason(null)
                    setReportDone(false)
                    setReportOpen(true)
                  }}
                >
                  <Text style={styles.menuActionText}>Ilmoita henkilö</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.thread}>
          {messages.map((message) => (
            <View
              key={message.id}
              style={[styles.bubble, message.from === "me" ? styles.mine : styles.theirs]}
            >
              <Text style={[styles.bubbleText, message.from === "me" && styles.mineText]}>{message.text}</Text>
            </View>
          ))}
          {typingId === personId ? <Text style={styles.typing}>Kirjoittaa…</Text> : null}
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Kirjoita viesti"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <Pressable
            style={styles.send}
            onPress={() => {
              if (!personId || !text.trim()) return
              
              // Validate message before sending
              const validation = validateMessage(text.trim())
              if (!validation.valid) {
                Alert.alert("Virhe", validation.error)
                return
              }
              
              send(personId, text)
              setText("")
            }}
          >
            <Text style={styles.sendText}>Lähetä</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <Modal visible={confirmRemove} transparent animationType="fade" onRequestClose={() => setConfirmRemove(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Haluatko varmasti poistaa henkilön?</Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.confirmYes}
                onPress={() => {
                  if (!personId) return
                  setConfirmRemove(false)
                  returnToDeck(personId)
                  router.replace("/")
                }}
              >
                <Text style={styles.confirmYesText}>Kyllä</Text>
              </Pressable>
              <Pressable style={styles.confirmNo} onPress={() => setConfirmRemove(false)}>
                <Text style={styles.confirmNoText}>En</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={confirmBlock} transparent animationType="fade" onRequestClose={() => setConfirmBlock(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Haluatko varmasti estää henkilön?</Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.confirmYes}
                onPress={() => {
                  if (!personId) return
                  block(personId)
                  setConfirmBlock(false)
                  router.replace("/matches")
                }}
              >
                <Text style={styles.confirmYesText}>Kyllä</Text>
              </Pressable>
              <Pressable style={styles.confirmNo} onPress={() => setConfirmBlock(false)}>
                <Text style={styles.confirmNoText}>En</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{reportDone ? "Ilmoitus tallennettiin" : "Ilmoita henkilö"}</Text>
            {reportDone ? (
              <Text style={styles.reportNote}>
                Ilmoitus pysyy tässä puhelimessa. Yhteistä tiliä ei ole, joten se ei siirry toiselle ihmiselle.
              </Text>
            ) : (
              <View style={styles.reportList}>
                {reportReasons.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.reportChoice, reason === item.id && styles.reportChoiceOn]}
                    onPress={() => setReason(item.id)}
                  >
                    <Text style={[styles.reportChoiceText, reason === item.id && styles.reportChoiceTextOn]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.confirmActions}>
              {reportDone ? (
                <Pressable style={styles.confirmYes} onPress={() => setReportOpen(false)}>
                  <Text style={styles.confirmYesText}>Sulje</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    style={[styles.confirmYes, !reason && styles.reportDisabled]}
                    disabled={!reason}
                    onPress={() => {
                      if (!personId || !reason) return
                      void rememberPhoneReport(personId, reason).then(() => setReportDone(true))
                    }}
                  >
                    <Text style={styles.confirmYesText}>Lähetä</Text>
                  </Pressable>
                  <Pressable style={styles.confirmNo} onPress={() => setReportOpen(false)}>
                    <Text style={styles.confirmNoText}>Peruuta</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={photoAt !== null && frames.length > 0} animationType="fade" onRequestClose={() => setPhotoAt(null)}>
        <SafeAreaView style={styles.viewer}>
          <View style={styles.viewerBar}>
            <View>
              <Text style={styles.viewerName}>{person?.name}</Text>
              <Text style={styles.viewerCount}>
                Kuva {openIndex + 1} / {frames.length}
              </Text>
            </View>
            <Pressable onPress={() => setPhotoAt(null)} hitSlop={8}>
              <Text style={styles.photos}>Sulje</Text>
            </Pressable>
          </View>
          <View style={styles.viewerFrame}>
            {frames[openIndex] ? <Portrait scene={frames[openIndex]} /> : null}
          </View>
          {frames.length > 1 ? (
            <View style={styles.viewerNav}>
              <Pressable style={styles.navButton} onPress={() => setPhotoAt(openIndex - 1)}>
                <Text style={styles.navText}>Edellinen</Text>
              </Pressable>
              <Pressable style={styles.navButton} onPress={() => setPhotoAt(openIndex + 1)}>
                <Text style={styles.navText}>Seuraava</Text>
              </Pressable>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const reportReasons = [
  { id: "sopimaton", label: "Sopimaton sisältö" },
  { id: "hairinta", label: "Häirintä" },
  { id: "huijaus", label: "Huijaus" },
  { id: "alaikainen", label: "Vaikuttaa alaikäiseltä" },
]

async function rememberPhoneReport(personId: string, reason: string) {
  const raw = await AsyncStorage.getItem("partner-reports").catch(() => null)
  let current: unknown = []
  if (raw) {
    try {
      current = JSON.parse(raw)
    } catch {
      current = []
    }
  }
  const list = Array.isArray(current) ? current : []
  const next = [...list, { personId, reason, at: Date.now() }].slice(-50)
  await AsyncStorage.setItem("partner-reports", JSON.stringify(next))
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, zIndex: 2 },
  back: { color: colors.ink, fontSize: 16 },
  title: { flex: 1, fontSize: 22, fontWeight: "700", color: colors.ink },
  menuWrap: { position: "relative", alignItems: "flex-end" },
  menuBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  menuGlyph: { color: colors.ink, fontSize: 18, fontWeight: "700", letterSpacing: 1, marginTop: -4 },
  menuSheet: { position: "absolute", top: 40, right: 0, gap: 8, alignItems: "flex-end" },
  menuAction: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  menuActionText: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(21, 32, 43, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
  },
  confirmTitle: { color: colors.ink, fontSize: 22, fontWeight: "700" },
  confirmActions: { flexDirection: "row", gap: 8, marginTop: 18 },
  confirmYes: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmYesText: { color: colors.onPrimary, fontWeight: "600" },
  confirmNo: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmNoText: { color: colors.ink, fontWeight: "600" },
  reportNote: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 12 },
  reportList: { gap: 8, marginTop: 16 },
  reportChoice: {
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  reportChoiceOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  reportChoiceText: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  reportChoiceTextOn: { color: colors.bg },
  reportDisabled: { opacity: 0.4 },
  photos: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  avatar: { width: 40, height: 40, borderRadius: 8, overflow: "hidden" },
  viewer: { flex: 1, backgroundColor: colors.bg },
  viewerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewerName: { fontSize: 24, fontWeight: "600", color: colors.ink },
  viewerCount: { color: colors.muted, marginTop: 2 },
  viewerFrame: { flex: 1, marginHorizontal: 16, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
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
  thread: { padding: 16, gap: 8 },
  bubble: { maxWidth: "82%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.primary },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.chip },
  bubbleText: { color: colors.ink, fontSize: 16, lineHeight: 22 },
  mineText: { color: colors.onPrimary },
  typing: { color: colors.muted, marginTop: 4 },
  composer: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    color: colors.ink,
  },
  send: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: colors.onPrimary, fontWeight: "600" },
})
