import { useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { colors } from '../theme/colors'

type WaveTitleProps = {
  text: string
  active?: boolean
}

const LETTER_DELAY_MS = 48
const LIFT = -7
const LIFT_DURATION = 160
const SETTLE_DURATION = 200
const LOOP_PAUSE_MS = 1400

export function WaveTitle({ text, active = true }: WaveTitleProps) {
  const chars = useMemo(() => text.split(''), [text])
  const valuesRef = useRef<Animated.Value[]>([])

  if (valuesRef.current.length !== chars.length) {
    valuesRef.current = chars.map((_, index) => valuesRef.current[index] ?? new Animated.Value(0))
    valuesRef.current.length = chars.length
  }

  useEffect(() => {
    if (!active) return

    let cancelled = false
    const values = valuesRef.current

    values.forEach((value) => value.setValue(0))

    function runWave() {
      if (cancelled) return

      const wave = values.map((value, index) =>
        Animated.sequence([
          Animated.delay(index * LETTER_DELAY_MS),
          Animated.timing(value, {
            toValue: LIFT,
            duration: LIFT_DURATION,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: SETTLE_DURATION,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
        ]),
      )

      Animated.parallel(wave).start(({ finished }) => {
        if (!finished || cancelled) return
        setTimeout(runWave, LOOP_PAUSE_MS)
      })
    }

    runWave()

    return () => {
      cancelled = true
      values.forEach((value) => value.stopAnimation())
    }
  }, [active, text, chars.length])

  return (
    <View style={styles.row}>
      {chars.map((char, index) => (
        <Animated.Text
          key={`${index}-${char}`}
          style={[
            styles.letter,
            {
              transform: [{ translateY: valuesRef.current[index] }],
            },
          ]}
        >
          {char === ' ' ? '\u00A0' : char}
        </Animated.Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  letter: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 26,
    textShadowColor: 'rgba(255, 107, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
})
