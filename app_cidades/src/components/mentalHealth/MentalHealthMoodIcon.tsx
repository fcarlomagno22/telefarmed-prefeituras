import LottieView from 'lottie-react-native'
import { Platform, StyleSheet, Text, View } from 'react-native'
import {
  getMentalHealthMoodLottie,
  getMentalHealthMoodLottieRenderPx,
  MENTAL_HEALTH_MOOD_LOTTIE_SLOT_PX,
} from '../../data/mentalHealthMoodAssets'
import type { MentalHealthMoodLevelId } from '../../types/mentalHealth'
import { getMentalHealthMoodEmoji } from '../../utils/mentalHealthCheckIn'

type MentalHealthMoodIconProps = {
  mood: MentalHealthMoodLevelId
  size?: 'compact' | 'drawer' | 'hero' | 'large' | 'snapshot'
  /** No picker/lista, anima só o ícone selecionado para evitar OOM no mobile. */
  active?: boolean
}

const SIZE_MAP = {
  compact: 92,
  drawer: 108,
  hero: 124,
  large: MENTAL_HEALTH_MOOD_LOTTIE_SLOT_PX,
  snapshot: 72,
} as const

export function MentalHealthMoodIcon({
  mood,
  size = 'compact',
  active = true,
}: MentalHealthMoodIconProps) {
  const lottie = getMentalHealthMoodLottie(mood)
  const slotSize = SIZE_MAP[size]
  const renderSize = getMentalHealthMoodLottieRenderPx(slotSize)
  const shouldAnimate = active

  if (lottie) {
    return (
      <View
        style={[
          styles.lottieWrap,
          { width: slotSize, height: slotSize },
          size === 'snapshot' && styles.lottieWrapSnapshot,
        ]}
        pointerEvents="none"
      >
        <LottieView
          source={lottie}
          autoPlay={shouldAnimate}
          loop={shouldAnimate && size !== 'snapshot'}
          renderMode={Platform.OS === 'web' ? 'SOFTWARE' : 'AUTOMATIC'}
          style={[
            styles.lottie,
            {
              width: renderSize,
              height: renderSize,
              maxWidth: renderSize,
              maxHeight: renderSize,
            },
          ]}
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
  lottieWrapSnapshot: {
    overflow: 'visible',
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
