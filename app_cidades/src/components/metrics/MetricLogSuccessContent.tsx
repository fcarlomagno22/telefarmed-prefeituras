import { StyleSheet, Text, View } from 'react-native'
import successAnimation from '../../../assets/success.json'
import { colors } from '../../theme/colors'
import { LottiePlayer } from '../LottiePlayer'

type MetricLogSuccessContentProps = {
  title: string
  message: string
}

export function MetricLogSuccessContent({ title, message }: MetricLogSuccessContentProps) {
  return (
    <View style={styles.wrap}>
      <LottiePlayer source={successAnimation} loop={false} style={styles.lottie} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
    minHeight: 280,
  },
  lottie: {
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
})
