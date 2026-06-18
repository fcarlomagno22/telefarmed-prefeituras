import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  MENTAL_HEALTH_MESSAGE_CLINICAL_NOTICE,
  MENTAL_HEALTH_MESSAGE_CONSIDERED_FACTORS,
  MENTAL_HEALTH_MESSAGE_EXPLAIN_INTRO,
} from '../../types/mentalHealth'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MentalHealthMessageExplainDrawerProps = {
  visible: boolean
  hasRecommendedActivity: boolean
  onClose: () => void
  onViewRecommendedActivity: () => void
}

export function MentalHealthMessageExplainDrawer({
  visible,
  hasRecommendedActivity,
  onClose,
  onViewRecommendedActivity,
}: MentalHealthMessageExplainDrawerProps) {
  function handleViewActivity() {
    onClose()
    onViewRecommendedActivity()
  }

  const footer = (
    <View style={styles.footer}>
      <PrimaryButton
        label="Ver atividade recomendada"
        onPress={handleViewActivity}
        disabled={!hasRecommendedActivity}
      />
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
      >
        <Text style={styles.closeBtnText}>Fechar</Text>
      </Pressable>
    </View>
  )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Entender esta mensagem"
      subtitle="Por que esta mensagem apareceu"
      onClose={onClose}
      footer={footer}
    >
      <Text style={styles.lead}>
        Explicamos de forma simples por que esta mensagem foi apresentada para você hoje.
      </Text>

      <Text style={styles.intro}>{MENTAL_HEALTH_MESSAGE_EXPLAIN_INTRO}</Text>

      <Text style={styles.sectionLabel}>Informações consideradas</Text>

      <View style={styles.factorsList}>
        {MENTAL_HEALTH_MESSAGE_CONSIDERED_FACTORS.map((factor) => (
          <View key={factor} style={styles.factorRow}>
            <View style={styles.factorBullet} />
            <Text style={styles.factorText}>{factor}</Text>
          </View>
        ))}
      </View>

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={16} color="#67e8f9" />
        <Text style={styles.noticeText}>{MENTAL_HEALTH_MESSAGE_CLINICAL_NOTICE}</Text>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  lead: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  intro: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    paddingTop: 4,
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingTop: 12,
  },
  factorsList: {
    gap: 10,
    paddingTop: 4,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  factorBullet: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(103, 232, 249, 0.55)',
    marginTop: 7,
  },
  factorText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(8, 145, 178, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.16)',
  },
  noticeText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  footer: {
    gap: 8,
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtnPressed: {
    opacity: 0.88,
  },
  closeBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
})
