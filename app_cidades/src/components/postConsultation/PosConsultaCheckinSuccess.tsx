import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import successAnimation from '../../../assets/success.json'
import { LottiePlayer } from '../LottiePlayer'
import { colors } from '../../theme/colors'
import { playSuccessSound } from '../../utils/appSounds'

export const POS_CONSULTA_SUCCESS_AUTO_CLOSE_MS = 1600

type PosConsultaCheckinSuccessProps = {
  patientFirstName: string
  nextCheckinLabel: string | null
  onClose: () => void
}

export function PosConsultaCheckinSuccess({
  patientFirstName,
  nextCheckinLabel,
  onClose,
}: PosConsultaCheckinSuccessProps) {
  const closeProgress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    void playSuccessSound()

    const animation = Animated.timing(closeProgress, {
      toValue: 1,
      duration: POS_CONSULTA_SUCCESS_AUTO_CLOSE_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    })

    animation.start()

    const timer = setTimeout(onClose, POS_CONSULTA_SUCCESS_AUTO_CLOSE_MS)

    return () => {
      clearTimeout(timer)
      animation.stop()
    }
  }, [closeProgress, onClose])

  const barWidth = closeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <View style={styles.lottieWrap}>
          <LottiePlayer
            source={successAnimation}
            loop={false}
            style={styles.lottie}
            animationStyle={styles.lottieAnimation}
          />
        </View>

        <Text style={styles.title}>Resposta registrada!</Text>

        <Text style={styles.subtitle}>
          Obrigado, {patientFirstName}. Suas respostas foram salvas e ajudam no seu acompanhamento.
        </Text>

        {nextCheckinLabel ? (
          <Text style={styles.nextInline}>
            Próximo contato em <Text style={styles.nextHighlight}>{nextCheckinLabel}</Text>
          </Text>
        ) : null}
      </View>

      <View style={styles.countdownTrack}>
        <Animated.View style={[styles.countdownFillWrap, { width: barWidth }]}>
          <LinearGradient
            colors={['#7dd3fc', '#0ea5e9', '#0284c7']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.countdownFill}
          />
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    minHeight: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  lottieWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
    overflow: 'visible',
  },
  lottie: {
    marginBottom: 0,
  },
  lottieAnimation: {
    width: 140,
    height: 140,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  nextInline: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  nextHighlight: {
    color: '#7dd3fc',
    fontWeight: '800',
  },
  countdownTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginTop: 8,
  },
  countdownFillWrap: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: 999,
  },
  countdownFill: {
    flex: 1,
    borderRadius: 999,
  },
})
