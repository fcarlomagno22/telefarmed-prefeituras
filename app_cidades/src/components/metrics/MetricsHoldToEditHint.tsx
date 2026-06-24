import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

export function MetricsHoldToEditHint() {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )

    animation.start()
    return () => {
      animation.stop()
    }
  }, [pulse])

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  })

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.03],
  })

  const iconShift = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1.5],
  })

  return (
    <Animated.View style={[styles.wrap, { opacity, transform: [{ scale }] }]}>
      <Animated.View style={{ transform: [{ translateY: iconShift }] }}>
        <MaterialCommunityIcons name="gesture-tap-hold" size={13} color={colors.primaryLight} />
      </Animated.View>
      <Text style={styles.text}>(segure para editar)</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
})
