import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import finishingAnimation from '../../../assets/animation_l.json'
import { colors } from '../../theme/colors'
import { LottiePlayer } from '../LottiePlayer'

const FINISHING_MESSAGES = [
  'Estamos concluindo o seu cadastro…',
  'Preparando o melhor app de saúde do Brasil para você…',
  'Montando sua área pessoal de cuidado…',
  'Organizando tudo para você cuidar da sua saúde…',
  'Quase lá! Só mais um instante…',
] as const

const MESSAGE_VISIBLE_MS = 2600
const FADE_MS = 450

export function RegisterFinishingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0)
  const textOpacity = useRef(new Animated.Value(1)).current
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function fadeToNextMessage() {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return

        setMessageIndex((current) => (current + 1) % FINISHING_MESSAGES.length)

        Animated.timing(textOpacity, {
          toValue: 1,
          duration: FADE_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start()
      })
    }

    intervalRef.current = setInterval(fadeToNextMessage, MESSAGE_VISIBLE_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [textOpacity])

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <LottiePlayer
          source={finishingAnimation}
          loop
          style={styles.lottieWrap}
          animationStyle={styles.lottie}
        />

        <Text style={styles.eyebrow}>Quase pronto</Text>

        <Animated.Text style={[styles.message, { opacity: textOpacity }]}>
          {FINISHING_MESSAGES[messageIndex]}
        </Animated.Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 360,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  lottieWrap: {
    marginBottom: 8,
  },
  lottie: {
    width: 220,
    height: 180,
  },
  eyebrow: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  message: {
    minHeight: 72,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
})
