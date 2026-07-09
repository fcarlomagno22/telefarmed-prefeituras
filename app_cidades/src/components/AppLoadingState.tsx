import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import loadingAnimation from '../../assets/animation_l.json'
import { colors } from '../theme/colors'
import { LottiePlayer } from './LottiePlayer'

type AppLoadingStateProps = {
  message?: string
  style?: StyleProp<ViewStyle>
}

export function AppLoadingState({ message = 'Carregando...', style }: AppLoadingStateProps) {
  return (
    <View style={[styles.wrap, style]}>
      <LottiePlayer
        source={loadingAnimation}
        loop
        style={styles.lottieWrap}
        animationStyle={styles.lottie}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 4,
  },
  lottieWrap: {
    marginBottom: 0,
  },
  lottie: {
    width: 180,
    height: 180,
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
})
