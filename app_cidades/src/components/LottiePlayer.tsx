import LottieView, { AnimationObject } from 'lottie-react-native'
import { StyleSheet, View, ViewStyle } from 'react-native'

type LottiePlayerProps = {
  source: AnimationObject
  style?: ViewStyle
  loop?: boolean
}

export function LottiePlayer({ source, style, loop = true }: LottiePlayerProps) {
  return (
    <View style={[styles.container, style]}>
      <LottieView source={source} autoPlay loop={loop} style={styles.animation} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  animation: {
    width: 180,
    height: 140,
  },
})
