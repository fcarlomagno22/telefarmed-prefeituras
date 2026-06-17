import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

type RunWalkHistoryAnimatedBarProps = {
  progress: number
  animate: boolean
  color: string
  duration?: number
  preserveFinal?: boolean
  trackStyle?: StyleProp<ViewStyle>
  fillStyle?: StyleProp<ViewStyle>
}

export function RunWalkHistoryAnimatedBar({
  progress,
  animate,
  color,
  duration = 1400,
  preserveFinal = true,
  trackStyle,
  fillStyle,
}: RunWalkHistoryAnimatedBarProps) {
  const animated = useRef(new Animated.Value(0)).current
  const clampedTarget = Math.min(1, Math.max(0, progress))

  useEffect(() => {
    if (!animate) {
      animated.stopAnimation()
      animated.setValue(preserveFinal ? clampedTarget : 0)
      return
    }

    animated.stopAnimation()
    animated.setValue(0)
    Animated.timing(animated, {
      toValue: clampedTarget,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [animate, animated, clampedTarget, duration, preserveFinal])

  const width = animated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={[styles.track, trackStyle]}>
      <Animated.View
        style={[styles.fill, { width, backgroundColor: color }, fillStyle]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
})
