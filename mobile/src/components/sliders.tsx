import { useRef } from "react"
import { PanResponder, StyleSheet, Text, View } from "react-native"
import { colors } from "../theme"

function useTrack() {
  const trackRef = useRef<View>(null)
  const metrics = useRef({ x: 0, width: 1 })
  const measure = () => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      if (width > 0) metrics.current = { x, width }
    })
  }
  return { trackRef, metrics, measure }
}

function snap(value: number, min: number, max: number, step: number) {
  const snapped = Math.round(value / step) * step
  return Math.min(max, Math.max(min, snapped))
}

export function SingleSlider({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string
  valueLabel: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}) {
  const { trackRef, metrics, measure } = useTrack()
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  valueRef.current = value
  onChangeRef.current = onChange
  const ratio = (value - min) / (max - min)

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        measure()
        const next = snap(
          min + ((event.nativeEvent.pageX - metrics.current.x) / metrics.current.width) * (max - min),
          min,
          max,
          step,
        )
        onChangeRef.current(next)
      },
      onPanResponderMove: (_event, gesture) => {
        const next = snap(
          min + ((gesture.moveX - metrics.current.x) / metrics.current.width) * (max - min),
          min,
          max,
          step,
        )
        onChangeRef.current(next)
      },
    }),
  ).current

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{valueLabel}</Text>
      </View>
      <View ref={trackRef} onLayout={measure} style={styles.trackHit} {...pan.panHandlers}>
        <View style={styles.track} />
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        <View style={[styles.thumb, { left: `${ratio * 100}%` }]} />
      </View>
      <View style={styles.ends}>
        <Text style={styles.end}>{min}</Text>
        <Text style={styles.end}>{max}</Text>
      </View>
    </View>
  )
}

export function DualSlider({
  label,
  min,
  max,
  step,
  low,
  high,
  onChange,
}: {
  label: string
  min: number
  max: number
  step: number
  low: number
  high: number
  onChange: (low: number, high: number) => void
}) {
  const { trackRef, metrics, measure } = useTrack()
  const values = useRef({ low, high })
  const onChangeRef = useRef(onChange)
  values.current = { low, high }
  onChangeRef.current = onChange

  const fromPage = (pageX: number) =>
    snap(min + ((pageX - metrics.current.x) / metrics.current.width) * (max - min), min, max, step)

  const lowPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        measure()
        const next = Math.min(fromPage(event.nativeEvent.pageX), values.current.high)
        onChangeRef.current(next, values.current.high)
      },
      onPanResponderMove: (_event, gesture) => {
        const next = Math.min(fromPage(gesture.moveX), values.current.high)
        onChangeRef.current(next, values.current.high)
      },
    }),
  ).current

  const highPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        measure()
        const next = Math.max(fromPage(event.nativeEvent.pageX), values.current.low)
        onChangeRef.current(values.current.low, next)
      },
      onPanResponderMove: (_event, gesture) => {
        const next = Math.max(fromPage(gesture.moveX), values.current.low)
        onChangeRef.current(values.current.low, next)
      },
    }),
  ).current

  const lowRatio = (low - min) / (max - min)
  const highRatio = (high - min) / (max - min)

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View ref={trackRef} onLayout={measure} style={styles.trackHit}>
        <View style={styles.track} />
        <View
          style={[
            styles.fill,
            { left: `${lowRatio * 100}%`, width: `${(highRatio - lowRatio) * 100}%` },
          ]}
        />
        <View style={[styles.thumb, { left: `${lowRatio * 100}%` }]} {...lowPan.panHandlers} />
        {low !== high && (
          <View style={[styles.thumb, { left: `${highRatio * 100}%` }]} {...highPan.panHandlers} />
        )}
      </View>
      <View style={styles.movingEnds}>
        <Text style={[styles.end, styles.moving, { left: `${lowRatio * 100}%` }]}>{low}</Text>
        {low !== high && (
          <Text style={[styles.end, styles.moving, { left: `${highRatio * 100}%` }]}>{high}</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  label: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  value: { color: colors.muted, fontSize: 14 },
  trackHit: { height: 44, justifyContent: "center", marginTop: 6 },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.chip,
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: "absolute",
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ends: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  movingEnds: { height: 18, marginTop: 2 },
  end: { color: colors.muted, fontSize: 12 },
  moving: { position: "absolute", transform: [{ translateX: -8 }] },
})
