import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { PosConsultaCheckinContext } from '../../types/posConsulta'
import { getEvolucaoBadge } from '../../utils/appointmentPostConsultation'

const ADESAO_LABELS = {
  sim: 'Tomou conforme orientado',
  parcial: 'Tomou em parte',
  nao: 'Não tomou',
} as const

type PosConsultaCheckinAlreadyAnsweredProps = {
  context: PosConsultaCheckinContext
}

export function PosConsultaCheckinAlreadyAnswered({
  context,
}: PosConsultaCheckinAlreadyAnsweredProps) {
  const respostas = context.respostas
  const evolucaoBadge = respostas?.evolucaoComparacao
    ? getEvolucaoBadge(respostas.evolucaoComparacao)
    : null

  return (
    <View>
      <Text style={styles.title}>Check-in já respondido</Text>
      <Text style={styles.subtitle}>
        {context.respondidoEmLabel
          ? `Você respondeu em ${context.respondidoEmLabel}.`
          : 'Este check-in já foi registrado.'}
      </Text>

      {respostas ? (
        <View style={styles.detailCard}>
          {evolucaoBadge ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Como estava</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: evolucaoBadge.background },
                ]}
              >
                <Text style={[styles.badgeText, { color: evolucaoBadge.text }]}>
                  {evolucaoBadge.label}
                  {respostas.intensidadeSintoma !== null
                    ? ` · ${respostas.intensidadeSintoma}/10`
                    : ''}
                </Text>
              </View>
            </View>
          ) : null}

          {respostas.medicacaoAdesao ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Medicamentos</Text>
              <Text style={styles.detailValue}>
                {ADESAO_LABELS[respostas.medicacaoAdesao]}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {context.nextCheckinLabel ? (
        <View style={styles.nextCard}>
          <Text style={styles.nextText}>
            Próximo contato previsto em{' '}
            <Text style={styles.nextHighlight}>{context.nextCheckinLabel}</Text>
          </Text>
        </View>
      ) : null}
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
  detailCard: {
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  detailRow: {
    gap: 6,
  },
  detailLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  nextCard: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.25)',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nextText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  nextHighlight: {
    color: '#7dd3fc',
    fontWeight: '800',
  },
})
