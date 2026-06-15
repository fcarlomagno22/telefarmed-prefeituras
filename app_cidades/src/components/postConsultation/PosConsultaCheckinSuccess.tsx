import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import successAnimation from '../../../assets/success.json'
import { LottiePlayer } from '../LottiePlayer'
import { colors } from '../../theme/colors'
import { playSuccessSound } from '../../utils/appSounds'

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
  useEffect(() => {
    void playSuccessSound()
  }, [])

  return (
    <View style={styles.root}>
      <View style={styles.lottieWrap}>
        <LottiePlayer
          source={successAnimation}
          loop={false}
          style={styles.lottie}
          animationStyle={styles.lottieAnimation}
        />
      </View>

      <Text style={styles.subtitle}>
        Obrigado, {patientFirstName}. Suas respostas foram salvas e ajudam no seu acompanhamento.
      </Text>

      {nextCheckinLabel ? (
        <Text style={styles.nextInline}>
          Próximo contato em <Text style={styles.nextHighlight}>{nextCheckinLabel}</Text>
        </Text>
      ) : null}

      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <LinearGradient
          colors={['#7dd3fc', '#0ea5e9', '#0284c7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Voltar ao acompanhamento</Text>
        </LinearGradient>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    width: '100%',
    gap: 8,
    paddingBottom: 4,
  },
  lottieWrap: {
    width: '100%',
    minHeight: 132,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 22,
    paddingBottom: 8,
    overflow: 'visible',
  },
  lottie: {
    marginBottom: 0,
  },
  lottieAnimation: {
    width: 108,
    height: 108,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  nextInline: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  nextHighlight: {
    color: '#7dd3fc',
    fontWeight: '800',
  },
  button: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
