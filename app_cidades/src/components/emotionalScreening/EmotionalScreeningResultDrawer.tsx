import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import type { EmotionalScreeningComputedResult, EmotionalScreeningInstrument } from '../../types/emotionalScreening'
import { EMOTIONAL_SCREENING_DISCLAIMER } from '../../types/emotionalScreening'
import { getSeverityColor } from '../../utils/emotionalScreeningScoring'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type EmotionalScreeningResultDrawerProps = {
  visible: boolean
  instrument: EmotionalScreeningInstrument | null
  result: EmotionalScreeningComputedResult | null
  onClose: () => void
}

export function EmotionalScreeningResultDrawer({
  visible,
  instrument,
  result,
  onClose,
}: EmotionalScreeningResultDrawerProps) {
  if (!instrument || !result) return null

  const severityColor = getSeverityColor(result.band.tone)

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Resultado da triagem"
      subtitle={instrument.title}
      onClose={onClose}
      footer={<PrimaryButton label="Fechar relatório" onPress={onClose} />}
    >
      <View style={styles.content}>
        <LinearGradient
          colors={[`${severityColor}33`, 'rgba(16, 16, 20, 0.92)']}
          style={styles.hero}
        >
          <Text style={styles.heroLabel}>Indicação</Text>
          <Text style={[styles.heroValue, { color: severityColor }]}>{result.band.label}</Text>
          <Text style={styles.heroDescription}>{result.band.description}</Text>
          {result.totalScore != null ? (
            <Text style={styles.scoreHint}>Pontuação da triagem: {result.totalScore}</Text>
          ) : null}
        </LinearGradient>

        {result.subscales?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Áreas avaliadas</Text>
            {result.subscales.map((subscale) => (
              <View key={subscale.id} style={styles.subscaleRow}>
                <Text style={styles.subscaleLabel}>{subscale.label}</Text>
                <Text style={[styles.subscaleBand, { color: getSeverityColor(subscale.band.tone) }]}>
                  {subscale.band.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O que fazer agora</Text>
          {result.recommendations.map((item) => (
            <Text key={item} style={styles.recommendation}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>Importante</Text>
          <Text style={styles.disclaimerText}>{EMOTIONAL_SCREENING_DISCLAIMER}</Text>
          <Text style={styles.disclaimerMeta}>
            Instrumento de referência: {instrument.instrumentCode}
          </Text>
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingBottom: 8,
  },
  hero: {
    borderRadius: 18,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroDescription: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  scoreHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  recommendation: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  subscaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  subscaleLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  subscaleBand: {
    fontSize: 12,
    fontWeight: '800',
  },
  disclaimerBox: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  disclaimerTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  disclaimerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  disclaimerMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
})
