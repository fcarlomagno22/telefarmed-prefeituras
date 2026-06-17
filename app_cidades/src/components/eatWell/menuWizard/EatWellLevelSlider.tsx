import * as Haptics from 'expo-haptics'
import { useRef } from 'react'
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { colors } from '../../../theme/colors'

type EatWellLevelSliderProps = {
  value: number
  min?: number
  max?: number
  minLabel: string
  maxLabel: string
  onChange: (value: number) => void
  accent?: string
}

export function EatWellLevelSlider({
  value,
  min = 1,
  max = 10,
  minLabel,
  maxLabel,
  onChange,
  accent = '#84cc16',
}: EatWellLevelSliderProps) {
  const trackRef = useRef<View>(null)
  const trackMetrics = useRef({ pageX: 0, width: 0 })
  const valueRef = useRef(value)
  valueRef.current = value

  function clamp(raw: number) {
    return Math.min(max, Math.max(min, Math.round(raw)))
  }

  function valueFromPageX(pageX: number) {
    const { pageX: trackX, width } = trackMetrics.current
    if (width <= 0) return valueRef.current

    const ratio = Math.min(1, Math.max(0, (pageX - trackX) / width))
    return clamp(min + ratio * (max - min))
  }

  function setValueFromPageX(pageX: number) {
    const next = valueFromPageX(pageX)
    if (next === valueRef.current) return
    void Haptics.selectionAsync()
    onChange(next)
  }

  function syncTrackMetrics(done?: () => void) {
    trackRef.current?.measureInWindow((pageX, _pageY, width) => {
      trackMetrics.current = { pageX, width }
      done?.()
    })
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gesture) => {
        syncTrackMetrics(() => setValueFromPageX(gesture.x0))
      },
      onPanResponderMove: (_, gesture) => {
        setValueFromPageX(gesture.moveX)
      },
    }),
  ).current

  function handleTrackLayout(_event: LayoutChangeEvent) {
    syncTrackMetrics()
  }

  const progress = (value - min) / (max - min)

  return (
    <View style={styles.wrap}>
      <Text style={styles.valueText}>
        {value}/{max}
      </Text>

      <View
        ref={trackRef}
        style={styles.trackTouch}
        onLayout={handleTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
        </View>
        <View style={[styles.thumb, { left: `${progress * 100}%` }]} />
      </View>

      <View style={styles.tickRow}>
        {Array.from({ length: max - min + 1 }, (_, index) => {
          const tick = min + index
          const active = tick <= value
          return (
            <View
              key={tick}
              style={[styles.tick, active && { backgroundColor: `${accent}88` }]}
            />
          )
        })}
      </View>

      <View style={styles.labelsRow}>
        <Text style={styles.label}>{minLabel}</Text>
        <Text style={styles.label}>{maxLabel}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  valueText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  trackTouch: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    width: 22,
    height: 22,
    marginTop: -11,
    marginLeft: -11,
    borderRadius: 11,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  tick: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
})
