import LottieView, { AnimationObject } from 'lottie-react-native'
import { StyleSheet, View, ViewStyle } from 'react-native'

type LottiePlayerProps = {
  source: AnimationObject
  style?: ViewStyle
  animationStyle?: ViewStyle
  loop?: boolean
}

export function LottiePlayer({ source, style, animationStyle, loop = true }: LottiePlayerProps) {
  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={source}
        autoPlay
        loop={loop}
        resizeMode="contain"
        style={[styles.animation, animationStyle]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'visible',
  },
  animation: {
    width: 180,
    height: 140,
  },
})
