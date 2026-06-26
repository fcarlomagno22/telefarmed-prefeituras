import { Image } from 'expo-image'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

type RunWalkLiveUserDotProps = {
  photoUri?: string | null
}

export function RunWalkLiveUserDot({ photoUri }: RunWalkLiveUserDotProps) {
  const pulse = useRef(new Animated.Value(0)).current
  const hasPhoto = Boolean(photoUri?.trim())

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    )

    animation.start()
    return () => animation.stop()
  }, [pulse])

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1.85],
  })

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.55, 0.18, 0],
  })

  return (
    <View style={styles.wrap} pointerEvents="none">
      {!hasPhoto ? (
        <Animated.View
          style={[
            styles.pulse,
            {
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
      ) : null}

      <View style={[styles.body, hasPhoto ? styles.bodyPhoto : styles.bodyDot]}>
        {hasPhoto ? (
          <Image source={{ uri: photoUri! }} style={styles.photo} contentFit="cover" />
        ) : null}
      </View>
    </View>
  )
}

const DOT_SIZE = 22
const PHOTO_SIZE = 36

const styles = StyleSheet.create({
  wrap: {
    width: PHOTO_SIZE + 12,
    height: PHOTO_SIZE + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.45)',
  },
  body: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  bodyDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
  },
  bodyPhoto: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
})
