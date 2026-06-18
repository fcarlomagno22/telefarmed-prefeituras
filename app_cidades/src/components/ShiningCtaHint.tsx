import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'

type ShiningCtaHintProps = {
  text: string
  active?: boolean
}

const SHINE_HIGH = '#FFE8CC'

export function ShiningCtaHint({ text, active = true }: ShiningCtaHintProps) {
  const glow = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!active) {
      glow.setValue(0)
      pulse.setValue(0)
      return
    }

    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    )

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )

    glowAnim.start()
    pulseAnim.start()

    return () => {
      glowAnim.stop()
      pulseAnim.stop()
    }
  }, [active, text, glow, pulse])

  const color = glow.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [colors.primaryLight, SHINE_HIGH, colors.primaryLight],
  })

  const textShadowRadius = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [5, 20],
  })

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  })

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <Animated.Text
        style={[
          styles.text,
          {
            color,
            textShadowColor: 'rgba(255, 184, 106, 0.95)',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius,
          },
        ]}
      >
        {text}
      </Animated.Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
})
