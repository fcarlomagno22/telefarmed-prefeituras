import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'
import { colors } from '../../theme/colors'
import { BibleGradientHeart } from './BibleGradientHeart'

type BibleVerseLikeButtonProps = {
  isLiked: boolean
  animateFill: boolean
  onPress: () => void
  accessibilityLabel: string
}

export function BibleVerseLikeButton({
  isLiked,
  animateFill,
  onPress,
  accessibilityLabel,
}: BibleVerseLikeButtonProps) {
  const fillProgress = useRef(new Animated.Value(isLiked ? 1 : 0)).current

  useEffect(() => {
    if (!animateFill) return

    fillProgress.setValue(0)
    Animated.timing(fillProgress, {
      toValue: 1,
      duration: 780,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [animateFill, fillProgress])

  useEffect(() => {
    if (animateFill) return

    if (isLiked) {
      fillProgress.setValue(1)
      return
    }

    Animated.timing(fillProgress, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [animateFill, fillProgress, isLiked])

  const outlineOpacity = fillProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0.45, 0],
  })

  const filledScale = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  })

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.iconStage}>
        <Animated.View style={[styles.layer, { opacity: outlineOpacity }]}>
          <Ionicons name="heart-outline" size={22} color={colors.textSubtle} />
        </Animated.View>
        <Animated.View
          style={[
            styles.layer,
            {
              opacity: fillProgress,
              transform: [{ scale: filledScale }],
            },
          ]}
        >
          <BibleGradientHeart size={22} />
        </Animated.View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  iconStage: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
})
