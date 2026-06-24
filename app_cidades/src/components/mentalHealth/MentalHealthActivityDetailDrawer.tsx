import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { getCatalogActivity } from '../../utils/mentalHealthActivityCatalog'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MentalHealthActivityDetailDrawerProps = {
  visible: boolean
  activityId: string | null
  isFavorite: boolean
  blockedByCrisis: boolean
  onClose: () => void
  onToggleFavorite: () => void
  onStart: () => void
  onOpenCrisisSupport: () => void
}

export function MentalHealthActivityDetailDrawer({
  visible,
  activityId,
  isFavorite,
  blockedByCrisis,
  onClose,
  onToggleFavorite,
  onStart,
  onOpenCrisisSupport,
}: MentalHealthActivityDetailDrawerProps) {
  const activity = activityId ? getCatalogActivity(activityId) : null
  if (!activity) return null

  const footer = (
    <View style={styles.footer}>
      {blockedByCrisis ? (
        <>
          <View style={styles.blockedNotice}>
            <Ionicons name="heart-outline" size={18} color="#fda4af" />
            <Text style={styles.blockedText}>
              Neste momento, o melhor passo é buscar apoio humano antes de atividades autoguiadas.
            </Text>
          </View>
          <PrimaryButton label="Ver opções de apoio" onPress={onOpenCrisisSupport} />
        </>
      ) : (
        <PrimaryButton label="Iniciar" onPress={onStart} />
      )}
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
      >
        <Text style={styles.closeBtnText}>Fechar</Text>
      </Pressable>
    </View>
  )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={activity.title}
      subtitle={
        activity.subtitle_user ??
        (activity.duration_min
          ? `${activity.duration_min} min · ${activity.modality_labels.join(' · ')}`
          : 'Cuidado guiado')
      }
      onClose={onClose}
      footer={footer}
    >
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onToggleFavorite()
        }}
        style={({ pressed }) => [styles.favoriteRow, pressed && styles.pressed]}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={18}
          color={isFavorite ? '#fda4af' : colors.textMuted}
        />
        <Text style={styles.favoriteText}>
          {isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        </Text>
      </Pressable>

      {activity.subtitle_user ? <Text style={styles.lead}>{activity.subtitle_user}</Text> : null}

      <View style={styles.metaRow}>
        <MetaChip icon="time-outline" label={`${activity.duration_min ?? 5} min`} />
        <MetaChip icon="list-outline" label={`${activity.steps.length} passos`} />
      </View>

      <Text style={styles.sectionLabel}>O que você vai fazer</Text>
      {activity.steps.slice(0, 3).map((step) => (
        <Text key={step.order} style={styles.stepPreview}>
          {step.order}. {step.instruction_user}
        </Text>
      ))}
      {activity.steps.length > 3 ? (
        <Text style={styles.stepPreviewMore}>
          + {activity.steps.length - 3} passos durante a atividade
        </Text>
      ) : null}

      <Text style={styles.sectionLabel}>Objetivo</Text>
      <Text style={styles.body}>{activity.objective_user ?? 'Um cuidado leve para o seu momento.'}</Text>

      <Text style={styles.sectionLabel}>Por que pode ajudar</Text>
      <Text style={styles.body}>{activity.why_may_help}</Text>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color="#67e8f9" />
        <Text style={styles.noteText}>
          Você pode pausar ou sair a qualquer momento. Se não estiver bem, pare e busque apoio.
        </Text>
      </View>
    </RunWalkSheetDrawer>
  )
}

function MetaChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={14} color="#a5f3fc" />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  lead: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.2)',
  },
  metaChipText: {
    color: '#a5f3fc',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingTop: 14,
  },
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 4,
  },
  stepPreview: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 6,
  },
  stepPreviewMore: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 17,
    paddingTop: 4,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(8, 145, 178, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(8, 145, 178, 0.16)',
  },
  noteText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    gap: 8,
  },
  blockedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.22)',
  },
  blockedText: {
    flex: 1,
    color: '#fecdd3',
    fontSize: 13,
    lineHeight: 19,
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
  closeBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginBottom: 4,
  },
  favoriteText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
  },
})
