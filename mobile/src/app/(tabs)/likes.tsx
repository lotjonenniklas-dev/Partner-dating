import { router } from "expo-router"
import { useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Portrait } from "../../components/portrait"
import { formatLikeRemaining } from "../../lib/like-ttl"
import { usePartner } from "../../lib/store"
import { useBounded } from "../../lib/use-bounded"
import { colors } from "../../theme"

export default function LikesScreen() {
  const { pending, likeSentAt } = usePartner()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(Date.now())
      timer = setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    timer = setTimeout(tick, 1000 - (Date.now() % 1000))
    return () => clearTimeout(timer)
  }, [])
  const sent = useBounded(
    [...pending].sort((a, b) => (likeSentAt[b.id] ?? 0) - (likeSentAt[a.id] ?? 0)),
  )

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.body}>
        {sent.shown.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Ei lähetettyjä tykkäyksiä</Text>
            <Text style={styles.sub}>Tykkää profiileista Tutustu-sivulla. Tykkäys näkyy tässä vuorokauden.</Text>
            <Pressable style={styles.button} onPress={() => router.push("/")}>
              <Text style={styles.buttonText}>Siirry tutustumaan</Text>
            </Pressable>
          </View>
        ) : (
          sent.shown.map((person) => (
            <View key={person.id} style={styles.row}>
              <View style={styles.avatar}>
                <Portrait scene={person.scene} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {person.name}, {person.age}
                </Text>
                <Text style={styles.preview}>
                  {person.city}
                  {typeof likeSentAt[person.id] === "number"
                    ? ` · ${formatLikeRemaining(likeSentAt[person.id], now)}`
                    : ""}
                </Text>
              </View>
            </View>
          ))
        )}
        {sent.hidden > 0 ? (
          <Pressable onPress={sent.more}>
            <Text style={styles.sub}>Näytä lisää</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingBottom: 32 },
  sub: { marginTop: 8, color: colors.muted, fontSize: 15, fontWeight: "500", lineHeight: 21 },
  row: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 10, overflow: "hidden" },
  name: { fontSize: 18, color: colors.ink, fontWeight: "700" },
  preview: { color: colors.muted, marginTop: 2 },
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
