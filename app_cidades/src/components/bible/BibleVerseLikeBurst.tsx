import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { BibleGradientHeart } from './BibleGradientHeart'

type BibleVerseLikeBurstProps = {
  visible: boolean
  onComplete: () => void
}

export function BibleVerseLikeBurst({ visible, onComplete }: BibleVerseLikeBurstProps) {
  const scale = useRef(new Animated.Value(0.6)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) return

    scale.setValue(0.6)
    opacity.setValue(0)

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.18,
          duration: 325,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: 325,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      { iterations: 2 },
    )

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      pulse,
    ]).start(({ finished }) => {
      if (!finished) return

      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => onComplete())
    })
  }, [visible, onComplete, opacity, scale])

  if (!visible) return null

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.heartWrap, { opacity, transform: [{ scale }] }]}>
        <BibleGradientHeart size={88} />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  heartWrap: {
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  },
})
