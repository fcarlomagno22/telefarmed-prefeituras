import LottieView, { AnimationObject } from 'lottie-react-native'
import { useMemo } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import {
  applyFunctionalLottieBackground,
  FUNCTIONAL_LOTTIE_STAGE,
  FUNCTIONAL_LOTTIE_STAGE_BORDER,
  getFunctionalLottieExtraPadding,
} from '../../utils/functionalLottieBackground'

type FunctionalLottieVariant = 'thumb' | 'card' | 'hero' | 'session'

type FunctionalLottieProps = {
  source: AnimationObject
  exerciseId?: string
  style?: ViewStyle
  loop?: boolean
  autoPlay?: boolean
  variant?: FunctionalLottieVariant
}

const VARIANT_LAYOUT: Record<
  FunctionalLottieVariant,
  { padding: number; aspectRatio: number }
> = {
  thumb: { padding: 3, aspectRatio: 1 },
  card: { padding: 6, aspectRatio: 1 },
  hero: { padding: 10, aspectRatio: 1 },
  session: { padding: 14, aspectRatio: 1 },
}

export function FunctionalLottie({
  source,
  exerciseId,
  style,
  loop = true,
  autoPlay = true,
  variant = 'card',
}: FunctionalLottieProps) {
  const preparedSource = useMemo(
    () => applyFunctionalLottieBackground(source, exerciseId),
    [source, exerciseId],
  )
  const layout = VARIANT_LAYOUT[variant]
  const padding = layout.padding + getFunctionalLottieExtraPadding(exerciseId)

  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        { aspectRatio: layout.aspectRatio },
        style,
      ]}
    >
      <View style={[styles.inner, { padding }]}>
        <LottieView
          source={preparedSource}
          autoPlay={autoPlay}
          loop={loop}
          resizeMode="contain"
          style={styles.animation}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: FUNCTIONAL_LOTTIE_STAGE,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: FUNCTIONAL_LOTTIE_STAGE_BORDER,
    alignSelf: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  animation: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
})

const variantStyles = StyleSheet.create({
  thumb: {
    borderRadius: 12,
    width: '100%',
    height: '100%',
  },
  card: {
    borderRadius: 14,
    width: '100%',
  },
  hero: {
    borderRadius: 16,
    width: '100%',
  },
  session: {
    borderRadius: 20,
    width: '100%',
  },
})
