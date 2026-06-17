import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text } from 'react-native'

const VISIBLE_MS = 2600
const SLIDE_IN_MS = 320
const SLIDE_OUT_MS = 280

type ActionToastProps = {
  message: string | null
  onHidden: () => void
  bottomOffset?: number
}

export function ActionToast({ message, onHidden, bottomOffset = 96 }: ActionToastProps) {
  const translateX = useRef(new Animated.Value(-360)).current
  const opacity = useRef(new Animated.Value(0)).current
  const messageRef = useRef<string | null>(null)

  useEffect(() => {
    if (!message) return

    messageRef.current = message
    translateX.setValue(-360)
    opacity.setValue(1)

    const enter = Animated.timing(translateX, {
      toValue: 0,
      duration: SLIDE_IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    })

    const dismissTimer = setTimeout(() => {
      Animated.timing(translateX, {
        toValue: 360,
        duration: SLIDE_OUT_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          opacity.setValue(0)
          messageRef.current = null
          onHidden()
        }
      })
    }, VISIBLE_MS)

    enter.start()

    return () => {
      clearTimeout(dismissTimer)
    }
  }, [message, onHidden, opacity, translateX])

  if (!message) return null

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.host,
        {
          bottom: bottomOffset,
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      <LinearGradient
        colors={['#86efac', '#4ade80', '#16a34a']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.toast}
      >
        <Text style={styles.text}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    maxWidth: '78%',
    zIndex: 40,
    elevation: 12,
  },
  toast: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#15803d',
  },
  text: {
    color: '#052e16',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
})
