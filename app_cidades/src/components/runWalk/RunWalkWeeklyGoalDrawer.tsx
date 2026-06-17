import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { WeeklyGoalTargets } from '../../types/runWalk'
import {
  DEFAULT_WEEKLY_GOAL_DRAFT,
  WEEKLY_GOAL_LIMITS,
  WEEKLY_GOAL_PRESETS,
} from '../../utils/runWalkWeeklyGoal'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkProgressRing } from './RunWalkProgressRing'
import { RunWalkSheetDrawer } from './RunWalkSheetDrawer'

type RunWalkWeeklyGoalDrawerProps = {
  visible: boolean
  initialTargets: WeeklyGoalTargets | null
  currentProgress: {
    completedActivities: number
    activeMinutes: number
    movementDays: number
  }
  onClose: () => void
  onSave: (targets: WeeklyGoalTargets) => void
}

type GoalMetricKey = 'targetActivities' | 'targetActiveMinutes' | 'targetMovementDays'

type MetricConfig = {
  key: GoalMetricKey
  label: string
  hint: string
  icon: keyof typeof Ionicons.glyphMap
  unit: string
  gradient: readonly [string, string, string]
  ringId: string
  min: number
  max: number
  step: number
}

const METRICS: MetricConfig[] = [
  {
    key: 'targetActivities',
    label: 'Atividades',
    hint: 'Quantas sessões você quer completar',
    icon: 'fitness-outline',
    unit: 'por semana',
    gradient: ['#93c5fd', '#3b82f6', '#1d4ed8'],
    ringId: 'goalDraftActivities',
    min: WEEKLY_GOAL_LIMITS.activities.min,
    max: WEEKLY_GOAL_LIMITS.activities.max,
    step: 1,
  },
  {
    key: 'targetActiveMinutes',
    label: 'Minutos ativos',
    hint: 'Tempo total em movimento na semana',
    icon: 'timer-outline',
    unit: 'min/semana',
    gradient: ['#bfdbfe', '#60a5fa', '#2563eb'],
    ringId: 'goalDraftMinutes',
    min: WEEKLY_GOAL_LIMITS.minutes.min,
    max: WEEKLY_GOAL_LIMITS.minutes.max,
    step: WEEKLY_GOAL_LIMITS.minutes.step,
  },
  {
    key: 'targetMovementDays',
    label: 'Dias em movimento',
    hint: 'Em quantos dias você quer se movimentar',
    icon: 'footsteps-outline',
    unit: 'dias/semana',
    gradient: ['#c4b5fd', '#818cf8', '#6366f1'],
    ringId: 'goalDraftDays',
    min: WEEKLY_GOAL_LIMITS.movementDays.min,
    max: WEEKLY_GOAL_LIMITS.movementDays.max,
    step: 1,
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function GoalMetricStepper({
  metric,
  value,
  onChange,
}: {
  metric: MetricConfig
  value: number
  onChange: (next: number) => void
}) {
  function adjust(delta: number) {
    void Haptics.selectionAsync()
    onChange(clamp(value + delta * metric.step, metric.min, metric.max))
  }

  return (
    <LinearGradient
      colors={['rgba(37, 99, 235, 0.18)', 'rgba(14, 14, 20, 0.92)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.metricCard}
    >
      <View style={styles.metricHeader}>
        <View style={styles.metricIconWrap}>
          <Ionicons name={metric.icon} size={18} color="#93c5fd" />
        </View>
        <View style={styles.metricHeaderText}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <Text style={styles.metricHint}>{metric.hint}</Text>
        </View>
      </View>

      <View style={styles.stepperRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${metric.label}`}
          onPress={() => adjust(-1)}
          disabled={value <= metric.min}
          style={({ pressed }) => [
            styles.stepperButton,
            value <= metric.min && styles.stepperButtonDisabled,
            pressed && styles.stepperButtonPressed,
          ]}
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </Pressable>

        <View style={styles.valueBlock}>
          <Text style={styles.valueNumber}>{value}</Text>
          <Text style={styles.valueUnit}>{metric.unit}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${metric.label}`}
          onPress={() => adjust(1)}
          disabled={value >= metric.max}
          style={({ pressed }) => [
            styles.stepperButton,
            value >= metric.max && styles.stepperButtonDisabled,
            pressed && styles.stepperButtonPressed,
          ]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>
    </LinearGradient>
  )
}

export function RunWalkWeeklyGoalDrawer({
  visible,
  initialTargets,
  currentProgress,
  onClose,
  onSave,
}: RunWalkWeeklyGoalDrawerProps) {
  const [draft, setDraft] = useState<WeeklyGoalTargets>(DEFAULT_WEEKLY_GOAL_DRAFT)
  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setDraft(initialTargets ?? DEFAULT_WEEKLY_GOAL_DRAFT)
    setActivePresetId(
      WEEKLY_GOAL_PRESETS.find(
        (preset) =>
          preset.targets.targetActivities === initialTargets?.targetActivities &&
          preset.targets.targetActiveMinutes === initialTargets?.targetActiveMinutes &&
          preset.targets.targetMovementDays === initialTargets?.targetMovementDays,
      )?.id ?? null,
    )
  }, [visible, initialTargets])

  const previewRings = useMemo(
    () => [
      {
        progress: currentProgress.completedActivities / draft.targetActivities,
        value: `${currentProgress.completedActivities}/${draft.targetActivities}`,
        label: 'Atividades',
        gradientId: 'goalPreviewActivities',
        gradientColors: ['#93c5fd', '#3b82f6', '#1d4ed8'] as const,
      },
      {
        progress: currentProgress.activeMinutes / draft.targetActiveMinutes,
        value: `${currentProgress.activeMinutes}`,
        label: 'Minutos',
        gradientId: 'goalPreviewMinutes',
        gradientColors: ['#bfdbfe', '#60a5fa', '#2563eb'] as const,
      },
      {
        progress: currentProgress.movementDays / draft.targetMovementDays,
        value: `${currentProgress.movementDays}`,
        label: 'Dias',
        gradientId: 'goalPreviewDays',
        gradientColors: ['#c4b5fd', '#818cf8', '#6366f1'] as const,
      },
    ],
    [currentProgress, draft],
  )

  function updateDraft(key: GoalMetricKey, value: number) {
    setActivePresetId(null)
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function applyPreset(presetId: string, targets: WeeklyGoalTargets) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setActivePresetId(presetId)
    setDraft(targets)
  }

  function handleSave() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onSave(draft)
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={initialTargets ? 'Editar meta semanal' : 'Definir meta semanal'}
      subtitle="Ajuste atividades, minutos e dias em movimento para a sua semana"
      onClose={onClose}
      fullScreen
      footer={<PrimaryButton label="Salvar meta" onPress={handleSave} />}
    >
      <View style={styles.presetsRow}>
        {WEEKLY_GOAL_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id
          return (
            <Pressable
              key={preset.id}
              accessibilityRole="button"
              accessibilityLabel={`Preset ${preset.label}`}
              onPress={() => applyPreset(preset.id, preset.targets)}
              style={({ pressed }) => [
                styles.presetChip,
                isActive && styles.presetChipActive,
                pressed && styles.presetChipPressed,
              ]}
            >
              <Text
                style={[styles.presetLabel, isActive && styles.presetLabelActive]}
                numberOfLines={1}
              >
                {preset.label}
              </Text>
              <Text
                style={[styles.presetSubtitle, isActive && styles.presetSubtitleActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {preset.subtitle}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.previewBlock}>
        <Text style={styles.previewTitle}>Prévia do progresso</Text>
        <View style={styles.previewRings}>
          {previewRings.map((ring) => (
            <View key={ring.gradientId} style={styles.previewRingItem}>
              <RunWalkProgressRing
                progress={ring.progress}
                value={ring.value}
                label={ring.label}
                size={64}
                stroke={4}
                gradientId={ring.gradientId}
                gradientColors={ring.gradientColors}
                animate={false}
              />
            </View>
          ))}
        </View>
        <Text style={styles.previewCaption}>
          Com base no que você já fez nesta semana
        </Text>
      </View>

      <View style={styles.metricsCol}>
        {METRICS.map((metric) => (
          <GoalMetricStepper
            key={metric.key}
            metric={metric}
            value={draft[metric.key]}
            onChange={(next) => updateDraft(metric.key, next)}
          />
        ))}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    borderColor: 'rgba(59, 130, 246, 0.55)',
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  presetChipPressed: {
    opacity: 0.9,
  },
  presetLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
  },
  presetLabelActive: {
    color: '#bfdbfe',
  },
  presetSubtitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  presetSubtitleActive: {
    color: 'rgba(191, 219, 254, 0.85)',
  },
  previewBlock: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.22)',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  previewTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  previewRings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewRingItem: {
    flex: 1,
    alignItems: 'center',
  },
  previewCaption: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  metricsCol: {
    gap: 10,
    paddingBottom: 8,
  },
  metricCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    padding: 12,
    gap: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
  },
  metricHeaderText: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  metricHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
  },
  stepperButtonDisabled: {
    opacity: 0.35,
  },
  stepperButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  valueBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  valueNumber: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  valueUnit: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
})
