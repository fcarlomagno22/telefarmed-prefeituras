import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native'

type SkeletonBoneProps = {
  width?: number | `${number}%`
  height: number
  borderRadius?: number
  style?: ViewStyle
}

export function SkeletonBone({
  width = '100%',
  height,
  borderRadius = 8,
  style,
}: SkeletonBoneProps) {
  const opacity = useRef(new Animated.Value(0.32)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.62,
          duration: 880,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.32,
          duration: 880,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )

    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[styles.bone, { width, height, borderRadius, opacity }, style]}
    />
  )
}

const styles = StyleSheet.create({
  bone: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
})
