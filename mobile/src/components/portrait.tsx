import { StyleSheet, View } from "react-native"
import type { Scene } from "../lib/people"

export function Portrait({ scene }: { scene: Scene }) {
  return (
    <View style={[styles.frame, { backgroundColor: scene.sky }]}>
      <View style={[styles.sun, { backgroundColor: scene.skyDeep }]} />
      <View style={[styles.ground, { backgroundColor: scene.ground }]} />
      <View style={styles.person}>
        <View style={[styles.hair, { backgroundColor: scene.hair }]} />
        <View style={[styles.face, { backgroundColor: scene.skin }]} />
        <View style={[styles.body, { backgroundColor: scene.shirt }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  frame: { flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "flex-end" },
  sun: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    top: 18,
    right: 28,
  },
  ground: { position: "absolute", left: 0, right: 0, bottom: 0, height: "38%" },
  person: { alignItems: "center", marginBottom: 18 },
  hair: {
    position: "absolute",
    top: 0,
    width: 78,
    height: 42,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    zIndex: 1,
  },
  face: { width: 72, height: 72, borderRadius: 36, marginTop: 10 },
  body: {
    width: 116,
    height: 78,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    marginTop: -8,
  },
})
