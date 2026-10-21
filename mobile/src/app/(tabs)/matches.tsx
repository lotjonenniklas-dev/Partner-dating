import { router } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useBounded } from "../../lib/use-bounded"
import { SafeAreaView } from "react-native-safe-area-context"
import { Portrait } from "../../components/portrait"
import { usePartner } from "../../lib/store"
import { colors } from "../../theme"

function time(at: number) {
  return new Intl.DateTimeFormat("fi-FI", { hour: "2-digit", minute: "2-digit" }).format(at)
}

export default function MatchesScreen() {
  const { matches, messagesFor } = usePartner()
  const started = (id: string) => messagesFor(id).some((message) => message.from === "me")
  const opened = matches
    .filter((person) => started(person.id))
    .sort((a, b) => (messagesFor(b.id).at(-1)?.at ?? 0) - (messagesFor(a.id).at(-1)?.at ?? 0))
  const fresh = matches.filter((person) => !started(person.id))
  const freshWindow = useBounded(fresh)
  const openedWindow = useBounded(opened)
  const empty = matches.length === 0

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>Osumat</Text>
        <Text style={styles.sub}>Keskustelu aukeaa, kun tykkäys on molemminpuolinen.</Text>
        {empty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Ei osumia vielä</Text>
            <Text style={styles.sub}>
              Tykkää profiileista Tutustu-sivulla. Jos toinen on jo tykännyt sinusta, osuma syntyy heti.
            </Text>
            <Pressable style={styles.button} onPress={() => router.push("/")}>
              <Text style={styles.buttonText}>Siirry tutustumaan</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {fresh.length > 0 ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
                  {freshWindow.shown.map((person) => (
                    <Pressable key={person.id} style={styles.tile} onPress={() => router.push(`/chat/${person.id}`)}>
                      <View style={styles.tilePhoto}>
                        <Portrait scene={person.scene} />
                      </View>
                      <Text numberOfLines={1} style={styles.tileName}>
                        {person.name}
                      </Text>
                    </Pressable>
                  ))}
                  {freshWindow.hidden > 0 ? (
                    <Pressable onPress={freshWindow.more} style={styles.tile}>
                      <Text style={styles.tileName}>Näytä lisää</Text>
                    </Pressable>
                  ) : null}
                </ScrollView>
              </>
            ) : null}
            {opened.length > 0 ? <Text style={styles.section}>KESKUSTELUT</Text> : null}
            {opened.length > 0
              ? openedWindow.shown.map((person) => {
                const last = messagesFor(person.id).at(-1)
                return (
                  <Pressable key={person.id} style={styles.row} onPress={() => router.push(`/chat/${person.id}`)}>
                    <View style={styles.avatar}>
                      <Portrait scene={person.scene} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.rowTop}>
                        <Text style={styles.name}>{person.name}</Text>
                        {last ? <Text style={styles.time}>{time(last.at)}</Text> : null}
                      </View>
                      <Text numberOfLines={1} style={styles.preview}>
                        {last ? `${last.from === "me" ? "Sinä: " : ""}${last.text}` : "Avaa keskustelu"}
                      </Text>
                    </View>
                  </Pressable>
                )
              })
              : null}
            {openedWindow.hidden > 0 ? (
              <Pressable onPress={openedWindow.more}>
                <Text style={styles.note}>Näytä lisää</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 32, fontWeight: "700", color: colors.ink },
  sub: { marginTop: 8, color: colors.muted, fontSize: 15, fontWeight: "500", lineHeight: 21 },
  section: { marginTop: 24, marginBottom: 8, color: colors.muted, fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },
  strip: { gap: 12, paddingBottom: 4, marginTop: 24 },
  tile: { width: 76 },
  tilePhoto: { width: 76, height: 102, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  tileName: { marginTop: 6, textAlign: "center", color: colors.ink, fontSize: 13, fontWeight: "600" },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
  },
  avatar: { width: 52, height: 52, borderRadius: 10, overflow: "hidden" },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { fontSize: 18, color: colors.ink, fontWeight: "700" },
  time: { color: colors.muted, fontSize: 12 },
  preview: { color: colors.muted, marginTop: 2 },
  note: { color: colors.muted },
  empty: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 24, fontWeight: "600", color: colors.ink },
  button: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.onPrimary, fontWeight: "600" },
})
