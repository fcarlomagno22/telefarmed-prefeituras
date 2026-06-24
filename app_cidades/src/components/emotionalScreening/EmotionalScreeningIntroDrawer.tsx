import { StyleSheet, Text, View } from 'react-native'
import type { EmotionalScreeningInstrument } from '../../types/emotionalScreening'
import { EMOTIONAL_SCREENING_DISCLAIMER } from '../../types/emotionalScreening'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type EmotionalScreeningIntroDrawerProps = {
  visible: boolean
  instrument: EmotionalScreeningInstrument | null
  onClose: () => void
  onStart: () => void
}

export function EmotionalScreeningIntroDrawer({
  visible,
  instrument,
  onClose,
  onStart,
}: EmotionalScreeningIntroDrawerProps) {
  if (!instrument) return null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={instrument.title}
      subtitle={`${instrument.instrumentCode} · ~${instrument.estimatedMinutes} min`}
      onClose={onClose}
      footer={<PrimaryButton label="Iniciar triagem" onPress={onStart} />}
    >
      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Público</Text>
          <Text style={styles.metaValue}>{instrument.audienceLabel}</Text>
        </View>
        <Text style={styles.intro}>{instrument.intro}</Text>
        <Text style={styles.subtitle}>{instrument.subtitle}</Text>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimer}>{EMOTIONAL_SCREENING_DISCLAIMER}</Text>
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 8,
  },
  metaRow: {
    gap: 2,
  },
  metaLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  intro: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  disclaimerBox: {
    marginTop: 4,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
})
