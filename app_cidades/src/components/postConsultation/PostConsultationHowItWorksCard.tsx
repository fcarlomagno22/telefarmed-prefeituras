import { StyleSheet, Text, View } from 'react-native'
import { POS_CONSULTA_PLAN_TOTAL_DAYS } from '../../config/posConsulta'
import { colors } from '../../theme/colors'

const STEPS = [
  `7 check-ins em ${POS_CONSULTA_PLAN_TOTAL_DAYS} dias após a consulta`,
  'Responda pelo app ou pelo link do e-mail',
  'Suas respostas ajudam a equipe a acompanhar sua evolução',
]

export function PostConsultationHowItWorksCard() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Como funciona</Text>
      <Text style={styles.summary}>
        {STEPS.join(' · ')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  title: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summary: {
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
})
