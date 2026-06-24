import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import successAnimation from '../../../assets/success.json'
import { colors } from '../../theme/colors'
import { LottiePlayer } from '../LottiePlayer'

type ScheduleRemoteCareSuccessStepProps = {
  patientName?: string
}

export function ScheduleRemoteCareSuccessStep({ patientName }: ScheduleRemoteCareSuccessStepProps) {
  const firstName = patientName?.trim().split(/\s+/)[0]

  return (
    <View style={styles.wrap}>
      <LottiePlayer source={successAnimation} loop={false} style={styles.lottie} />

      <Text style={styles.title}>Solicitação recebida</Text>
      <Text style={styles.message}>
        {firstName ? `${firstName}, ` : ''}recebemos seu pedido com carinho. A equipe de saúde vai
        analisar sua situação e você recebe a resposta por aqui em breve.
      </Text>

      <View style={styles.card}>
        <LinearGradient
          colors={['rgba(255, 133, 51, 0.22)', 'rgba(255, 107, 0, 0.08)', 'rgba(14, 14, 20, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.primaryLight} />
            </View>
            <Text style={styles.cardHeaderText}>Próximos passos</Text>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepBullet}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Nossa equipe revisa o motivo informado e a foto enviada.
            </Text>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepBullet}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Você recebe a resposta nas notificações do app — fique de olho por aqui.
            </Text>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepBullet}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Se for aprovado, enviamos o link da teleconsulta para você entrar direto pelo celular,
              sem precisar ir ao posto.
            </Text>
          </View>
        </LinearGradient>
      </View>

      <Text style={styles.footnote}>
        Enquanto isso, se precisar de ajuda urgente, procure uma unidade de saúde ou ligue para o
        serviço de emergência da sua cidade.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  lottie: {
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.3)',
    marginTop: 6,
  },
  cardGradient: {
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.3)',
  },
  cardHeaderText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.28)',
    marginTop: 1,
  },
  stepNumber: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  footnote: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 4,
  },
})
