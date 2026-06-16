import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { DispositionState } from '../../types/runWalk'
import { RunWalkSheetDrawer } from './RunWalkSheetDrawer'

type RunWalkDispositionExplainDrawerProps = {
  visible: boolean
  disposition: DispositionState | null
  onClose: () => void
}

export function RunWalkDispositionExplainDrawer({
  visible,
  disposition,
  onClose,
}: RunWalkDispositionExplainDrawerProps) {
  if (!disposition) return null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Sua disposição hoje"
      subtitle="Informações que ajudaram nesta recomendação"
      onClose={onClose}
      fullScreen
    >
      <View style={styles.summaryCard}>
        <Ionicons name="checkmark-circle" size={20} color="#67e8f9" />
        <Text style={styles.summaryText}>{disposition.message}</Text>
      </View>

      <Text style={styles.sectionTitle}>O que consideramos</Text>

      {disposition.factors.map((factor) => (
        <View
          key={factor.id}
          style={[styles.factorRow, !factor.considered && styles.factorRowMuted]}
        >
          <View style={styles.factorText}>
            <Text style={styles.factorLabel}>{factor.label}</Text>
            <Text style={styles.factorValue}>{factor.value}</Text>
          </View>
          {factor.considered ? (
            <Ionicons name="checkmark" size={16} color="#67e8f9" />
          ) : (
            <Ionicons name="remove" size={16} color={colors.textSubtle} />
          )}
        </View>
      ))}

      <Text style={styles.footerNote}>
        Essas informações são atualizadas conforme você registra sono, hidratação, atividades e
        como se sente no check-in diário.
      </Text>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.24)',
  },
  summaryText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.1,
    paddingTop: 4,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  factorRowMuted: {
    opacity: 0.55,
  },
  factorText: {
    flex: 1,
    gap: 2,
  },
  factorLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  factorValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  footerNote: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    paddingTop: 4,
    paddingBottom: 8,
  },
})
