import LottieView from 'lottie-react-native'
import { StyleSheet, Text, View } from 'react-native'
import { getMentalHealthMoodLottie, getMentalHealthMoodLottieScale } from '../../data/mentalHealthMoodAssets'
import type { MentalHealthMoodLevelId } from '../../types/mentalHealth'
import { getMentalHealthMoodEmoji } from '../../utils/mentalHealthCheckIn'

type MentalHealthMoodIconProps = {
  mood: MentalHealthMoodLevelId
  size?: 'compact' | 'drawer' | 'hero' | 'large'
}

const SIZE_MAP = {
  compact: 46,
  drawer: 54,
  hero: 62,
  large: 56,
} as const

export function MentalHealthMoodIcon({ mood, size = 'compact' }: MentalHealthMoodIconProps) {
  const lottie = getMentalHealthMoodLottie(mood)
  const dimension = SIZE_MAP[size]
  const scale = getMentalHealthMoodLottieScale(mood)
  const renderSize = dimension * scale

  if (lottie) {
    return (
      <View
        style={[styles.lottieWrap, { width: dimension, height: dimension }]}
        pointerEvents="none"
      >
        <LottieView
          source={lottie}
          autoPlay
          loop
          renderMode="SOFTWARE"
          style={[styles.lottie, { width: renderSize, height: renderSize }]}
        />
      </View>
    )
  }

  return (
    <Text
      style={[
        styles.emoji,
        size === 'drawer' && styles.emojiDrawer,
        size === 'hero' && styles.emojiHero,
      ]}
    >
      {getMentalHealthMoodEmoji(mood)}
    </Text>
  )
}

const styles = StyleSheet.create({
  lottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  lottie: {
    backgroundColor: 'transparent',
  },
  emoji: {
    fontSize: 28,
    lineHeight: 32,
  },
  emojiDrawer: {
    fontSize: 34,
    lineHeight: 38,
  },
  emojiHero: {
    fontSize: 46,
    lineHeight: 52,
  },
})
