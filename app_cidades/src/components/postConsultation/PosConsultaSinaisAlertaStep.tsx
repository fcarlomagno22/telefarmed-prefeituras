import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { POS_CONSULTA_ALERT_SIGNS } from '../../data/posConsultaAlertSigns'
import { colors } from '../../theme/colors'
import { PosConsultaCheckinRespostas } from '../../types/posConsulta'
import { PosConsultaStepActions } from './PosConsultaStepActions'

type PosConsultaSinaisAlertaStepProps = {
  respostas: PosConsultaCheckinRespostas
  onChange: (respostas: PosConsultaCheckinRespostas) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export function PosConsultaSinaisAlertaStep({
  respostas,
  onChange,
  onBack,
  onSubmit,
  isSubmitting = false,
}: PosConsultaSinaisAlertaStepProps) {
  const hasCriticalSign = Object.values(respostas.alertSigns).some(Boolean)

  function setAlertSign(id: keyof PosConsultaCheckinRespostas['alertSigns'], active: boolean) {
    onChange({
      ...respostas,
      alertSigns: { ...respostas.alertSigns, [id]: active },
    })
  }

  return (
    <View>
      <Text style={styles.title}>Algum sinal de alerta?</Text>
      <Text style={styles.subtitle}>
        Toque em Sim apenas para sintomas que você está sentindo agora.
      </Text>

      <View style={styles.signList}>
        {POS_CONSULTA_ALERT_SIGNS.map((sign) => {
          const isYes = respostas.alertSigns[sign.id]

          return (
            <View key={sign.id} style={styles.signCard}>
              <Text style={styles.signLabel}>{sign.label}</Text>
              <View style={styles.choiceRow}>
                <Pressable
                  onPress={() => setAlertSign(sign.id, false)}
                  style={({ pressed }) => [
                    styles.choiceButton,
                    !isYes && styles.choiceButtonSelectedNo,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      !isYes && styles.choiceTextSelectedNo,
                    ]}
                  >
                    Não
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAlertSign(sign.id, true)}
                  style={({ pressed }) => [
                    styles.choiceButton,
                    isYes && styles.choiceButtonSelectedYes,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      isYes && styles.choiceTextSelectedYes,
                    ]}
                  >
                    Sim
                  </Text>
                </Pressable>
              </View>
            </View>
          )
        })}
      </View>

      {hasCriticalSign ? (
        <View style={styles.alertBox}>
          <Ionicons name="warning-outline" size={18} color="#fcd34d" />
          <View style={styles.alertTextCol}>
            <Text style={styles.alertTitle}>Atenção</Text>
            <Text style={styles.alertText}>
              Se os sintomas forem intensos ou preocupantes, procure atendimento presencial ou
              ligue para o serviço de urgência da sua região. Suas respostas serão registradas
              para a equipe de saúde.
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.hint}>
          Se não tiver nenhum destes sinais, mantenha &quot;Não&quot; em todas as perguntas.
        </Text>
      )}

      <PosConsultaStepActions
        onBack={onBack}
        onContinue={onSubmit}
        continueLabel={isSubmitting ? 'Enviando…' : 'Enviar respostas'}
        continueLoading={isSubmitting}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  signList: {
    gap: 10,
  },
  signCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 10,
  },
  signLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceButtonSelectedNo: {
    borderColor: 'rgba(16, 185, 129, 0.55)',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  choiceButtonSelectedYes: {
    borderColor: 'rgba(244, 63, 94, 0.55)',
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
  },
  choiceText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  choiceTextSelectedNo: {
    color: '#6ee7b7',
  },
  choiceTextSelectedYes: {
    color: '#fda4af',
  },
  alertBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  alertTextCol: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    color: '#fcd34d',
    fontSize: 13,
    fontWeight: '800',
  },
  alertText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  hint: {
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 14,
  },
  optionPressed: {
    opacity: 0.88,
  },
})
