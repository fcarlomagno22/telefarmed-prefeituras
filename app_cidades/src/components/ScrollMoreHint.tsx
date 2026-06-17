import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

type ScrollMoreHintProps = {
  active: boolean
  compact?: boolean
}

export function ScrollMoreHint({ active, compact = false }: ScrollMoreHintProps) {
  const shift = useRef(new Animated.Value(0)).current
  const textOpacity = useRef(new Animated.Value(0.6)).current
  const loopRef = useRef<Animated.CompositeAnimation | null>(null)

  useEffect(() => {
    loopRef.current?.stop()

    if (!active) {
      shift.setValue(0)
      textOpacity.setValue(0.45)
      return
    }

    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(shift, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(shift, {
            toValue: 0,
            duration: 650,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 0.6,
            duration: 650,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    )

    loopRef.current = animation
    animation.start()

    return () => {
      animation.stop()
    }
  }, [active, shift, textOpacity])

  const arrowOneX = shift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  })

  const arrowTwoX = shift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 9],
  })

  const arrowOneOpacity = shift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.55, 1, 0.55],
  })

  const arrowTwoOpacity = shift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.85, 1, 0.85],
  })

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Animated.Text style={[styles.label, { opacity: active ? textOpacity : 0.45 }]}>
        Deslize para mais
      </Animated.Text>

      <View style={styles.arrows}>
        <Animated.View
          style={{
            opacity: active ? arrowOneOpacity : 0.4,
            transform: [{ translateX: active ? arrowOneX : 0 }],
          }}
        >
          <Ionicons name="chevron-forward" size={15} color={colors.primaryLight} />
        </Animated.View>

        <Animated.View
          style={[
            styles.secondArrow,
            {
              opacity: active ? arrowTwoOpacity : 0.55,
              transform: [{ translateX: active ? arrowTwoX : 0 }],
            },
          ]}
        >
          <Ionicons name="chevron-forward" size={15} color={colors.primary} />
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  containerCompact: {
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
    justifyContent: 'flex-end',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  arrows: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondArrow: {
    marginLeft: -7,
  },
})
