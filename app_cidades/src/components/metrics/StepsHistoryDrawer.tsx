import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import walkingAnimation from '../../../assets/walking.json'
import {
  DEFAULT_STEPS_GOAL,
  estimateCalories,
  estimateDistanceKm,
  estimateStepsFromDuration,
  filterStepsByPeriod,
  formatPeakWindow,
  formatStepsCount,
  formatStepsDayLabel,
  getStepsGoalStatus,
  getTodaySteps,
  summarizeStepsPeriod,
} from '../../data/mockStepsHistory'
import { colors } from '../../theme/colors'
import { ManualWalkEntry, StepsDayRecord, StepsPeriod } from '../../types/steps'
import { PrimaryButton } from '../PrimaryButton'

const SHEET_OFFSET = 620
const STEPS_GRADIENT = ['#6ee7b7', '#10b981', '#059669'] as const
const LOTTIE_SIZE = 120
const PERIOD_OPTIONS: { id: StepsPeriod; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
]
const DURATION_OPTIONS = [15, 30, 45, 60]

type StepsHistoryDrawerProps = {
  visible: boolean
  onClose: () => void
  records: StepsDayRecord[]
  hasIntegration: boolean
  onConnectPress: () => void
  onManualWalk: (entry: ManualWalkEntry) => void
}

function PeriodTab({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.periodTab,
        selected && styles.periodTabSelected,
        pressed && styles.periodTabPressed,
      ]}
    >
      <Text style={[styles.periodTabText, selected && styles.periodTabTextSelected]}>{label}</Text>
    </Pressable>
  )
}

function SummaryStat({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string
  value: string
  unit?: string
  highlight?: boolean
}) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryStatLabel}>{label}</Text>
      <Text style={[styles.summaryStatValue, highlight && styles.summaryStatValueHighlight]}>
        {value}
      </Text>
      {unit ? <Text style={styles.summaryStatUnit}>{unit}</Text> : null}
    </View>
  )
}

function DayRow({ record, goal }: { record: StepsDayRecord; goal: number }) {
  const progress = Math.min(record.steps / goal, 1)
  const hitGoal = record.steps >= goal
  const peakLabel = formatPeakWindow(record.peakHourStart, record.peakHourEnd)

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyDateCol}>
        <Text style={styles.historyDate}>{formatStepsDayLabel(record.date)}</Text>
        <Text style={styles.historySource}>{record.source}</Text>
      </View>

      <View style={styles.historyStepsCol}>
        <Text style={styles.historySteps}>{formatStepsCount(record.steps)}</Text>
        <View style={styles.historyProgressTrack}>
          <View
            style={[
              styles.historyProgressFill,
              { width: `${Math.round(progress * 100)}%` },
              hitGoal && styles.historyProgressFillDone,
            ]}
          />
        </View>
      </View>

      <View style={styles.historyMetaCol}>
        {hitGoal ? (
          <View style={styles.goalHitBadge}>
            <Ionicons name="checkmark" size={12} color="#34d399" />
          </View>
        ) : (
          <Text style={styles.goalPercent}>{Math.round(progress * 100)}%</Text>
        )}
        {peakLabel ? <Text style={styles.peakHint}>{peakLabel}</Text> : null}
      </View>
    </View>
  )
}

export function StepsHistoryDrawer({
  visible,
  onClose,
  records,
  hasIntegration,
  onConnectPress,
  onManualWalk,
}: StepsHistoryDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [period, setPeriod] = useState<StepsPeriod>('today')
  const [manualFormOpen, setManualFormOpen] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [stepsInput, setStepsInput] = useState(String(estimateStepsFromDuration(30)))
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const todaySteps = getTodaySteps(records)
  const goalStatus = getStepsGoalStatus(todaySteps)
  const showEmpty = !hasIntegration && records.length === 0

  const periodRecords = useMemo(() => filterStepsByPeriod(records, period), [records, period])
  const summary = useMemo(
    () => summarizeStepsPeriod(records, period),
    [records, period],
  )

  const periodTotalLabel = useMemo(() => {
    if (period === 'today') return 'Hoje'
    if (period === 'week') return 'Esta semana'
    return 'Este mês'
  }, [period])

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      setManualFormOpen(false)
      setPeriod('today')
      setDurationMinutes(30)
      setStepsInput(String(estimateStepsFromDuration(30)))
      sheetTranslateY.setValue(SHEET_OFFSET)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start()
    } else if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible])

  function closeSheet(done?: () => void) {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false)
      done?.()
    })
  }

  function handleDismiss() {
    if (!visible) return
    closeSheet(onClose)
  }

  function handleConnectPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    closeSheet(() => {
      onClose()
      onConnectPress()
    })
  }

  function handlePeriodChange(next: StepsPeriod) {
    void Haptics.selectionAsync()
    setPeriod(next)
  }

  function handleDurationSelect(minutes: number) {
    void Haptics.selectionAsync()
    setDurationMinutes(minutes)
    setStepsInput(String(estimateStepsFromDuration(minutes)))
  }

  function handleRegisterWalk() {
    const steps = Math.max(0, Math.round(Number(stepsInput.replace(/\D/g, '')) || 0))
    if (steps <= 0) return

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onManualWalk({ durationMinutes, steps })
    setManualFormOpen(false)
    setDurationMinutes(30)
    setStepsInput(String(estimateStepsFromDuration(30)))
  }

  if (!isMounted) return null

  return (
    <AppModal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 12,
              maxHeight: '92%',
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(36, 36, 46, 0.98)', 'rgba(14, 14, 20, 0.99)']}
            style={StyleSheet.absoluteFillObject}
          />
          {Platform.OS === 'ios' ? (
            <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
          ) : null}

          <LinearGradient
            colors={[...STEPS_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topAccent}
          />

          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <LinearGradient
              colors={[...STEPS_GRADIENT]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.fieldIconOrb}
            >
              <MaterialCommunityIcons name="walk" size={22} color="#fff" />
            </LinearGradient>

            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Histórico de passos</Text>
              <Text style={styles.subtitle}>
                {showEmpty ? 'Conecte um dispositivo para sincronizar' : 'Acompanhe sua meta diária'}
              </Text>
            </View>

            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar histórico de passos"
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {showEmpty ? (
            <View style={styles.heroLottieWrap}>
              <LottieView source={walkingAnimation} autoPlay loop style={styles.heroLottie} />
            </View>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {showEmpty ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nenhum passo sincronizado</Text>
                <Text style={styles.emptyBody}>
                  Conecte o Apple Health ou Health Connect para importar seus passos
                  automaticamente do relógio ou celular.
                </Text>

                <PrimaryButton
                  label={
                    Platform.OS === 'ios' ? 'Conectar Apple Health' : 'Conectar Health Connect'
                  }
                  onPress={handleConnectPress}
                />

                <Pressable
                  onPress={() => setManualFormOpen((open) => !open)}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Registrar caminhada</Text>
                </Pressable>

                {manualFormOpen ? (
                  <ManualWalkForm
                    durationMinutes={durationMinutes}
                    stepsInput={stepsInput}
                    onDurationSelect={handleDurationSelect}
                    onStepsChange={setStepsInput}
                    onSubmit={handleRegisterWalk}
                  />
                ) : null}
              </View>
            ) : (
              <>
                <View style={styles.currentCard}>
                  <Text style={styles.sectionLabel}>Leitura atual</Text>
                  <Text style={styles.currentSteps}>{formatStepsCount(todaySteps)}</Text>
                  <Text style={styles.currentGoalMeta}>
                    Meta do dia · {formatStepsCount(DEFAULT_STEPS_GOAL)} passos
                  </Text>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(Math.min(goalStatus.progress, 1) * 100)}%`,
                          backgroundColor: goalStatus.color,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.currentFooterRow}>
                    <View
                      style={[
                        styles.zoneBadge,
                        { backgroundColor: goalStatus.bg, borderColor: goalStatus.border },
                      ]}
                    >
                      <View style={[styles.zoneDot, { backgroundColor: goalStatus.color }]} />
                      <Text style={[styles.zoneLabel, { color: goalStatus.color }]}>
                        {goalStatus.label}
                      </Text>
                    </View>

                    <View style={styles.secondaryMetrics}>
                      <Text style={styles.secondaryMetric}>
                        {estimateDistanceKm(todaySteps)} km
                      </Text>
                      <Text style={styles.secondaryMetricDot}>·</Text>
                      <Text style={styles.secondaryMetric}>
                        {estimateCalories(todaySteps)} kcal
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.periodTabsRow}>
                  {PERIOD_OPTIONS.map((option) => (
                    <PeriodTab
                      key={option.id}
                      label={option.label}
                      selected={period === option.id}
                      onPress={() => handlePeriodChange(option.id)}
                    />
                  ))}
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.sectionLabel}>Resumo · {periodTotalLabel}</Text>
                  <View style={styles.summaryRow}>
                    <SummaryStat label="Mín/dia" value={formatStepsCount(summary.min)} />
                    <SummaryStat
                      label="Média/dia"
                      value={formatStepsCount(summary.avg)}
                      highlight
                    />
                    <SummaryStat label="Máx/dia" value={formatStepsCount(summary.max)} />
                  </View>
                  <Text style={styles.summaryTotal}>
                    {formatStepsCount(summary.total)} passos no período
                  </Text>
                  {period !== 'today' ? (
                    <Text style={styles.summaryHint}>
                      Meta batida em {summary.daysHitGoal}/{summary.daysInPeriod} dias
                    </Text>
                  ) : null}
                </View>

                <View style={styles.historyCard}>
                  <Text style={styles.sectionLabel}>Histórico</Text>
                  {periodRecords.length === 0 ? (
                    <Text style={styles.emptyListText}>Nenhum registro neste período.</Text>
                  ) : (
                    periodRecords.map((record, index) => (
                      <View key={record.id}>
                        <DayRow record={record} goal={DEFAULT_STEPS_GOAL} />
                        {index < periodRecords.length - 1 ? (
                          <View style={styles.rowDivider} />
                        ) : null}
                      </View>
                    ))
                  )}
                </View>

                {!hasIntegration ? (
                  <View style={styles.connectBanner}>
                    <MaterialCommunityIcons name="link-variant" size={18} color="#6ee7b7" />
                    <Text style={styles.connectBannerText}>
                      Conecte um app de saúde para manter o histórico sempre atualizado.
                    </Text>
                    <Pressable onPress={handleConnectPress} hitSlop={8}>
                      <Text style={styles.connectBannerAction}>Conectar</Text>
                    </Pressable>
                  </View>
                ) : null}

                <Pressable
                  onPress={() => setManualFormOpen((open) => !open)}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    styles.secondaryButtonInline,
                    pressed && styles.secondaryButtonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Registrar caminhada</Text>
                </Pressable>

                {manualFormOpen ? (
                  <ManualWalkForm
                    durationMinutes={durationMinutes}
                    stepsInput={stepsInput}
                    onDurationSelect={handleDurationSelect}
                    onStepsChange={setStepsInput}
                    onSubmit={handleRegisterWalk}
                  />
                ) : null}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </AppModal>
  )
}

function ManualWalkForm({
  durationMinutes,
  stepsInput,
  onDurationSelect,
  onStepsChange,
  onSubmit,
}: {
  durationMinutes: number
  stepsInput: string
  onDurationSelect: (minutes: number) => void
  onStepsChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <View style={styles.manualForm}>
      <Text style={styles.manualFormTitle}>Caminhada manual</Text>
      <Text style={styles.manualFormHint}>Duração estimada</Text>

      <View style={styles.durationRow}>
        {DURATION_OPTIONS.map((minutes) => (
          <Pressable
            key={minutes}
            onPress={() => onDurationSelect(minutes)}
            style={({ pressed }) => [
              styles.durationChip,
              durationMinutes === minutes && styles.durationChipSelected,
              pressed && styles.durationChipPressed,
            ]}
          >
            <Text
              style={[
                styles.durationChipText,
                durationMinutes === minutes && styles.durationChipTextSelected,
              ]}
            >
              {minutes} min
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.manualFormHint}>Passos estimados</Text>
      <TextInput
        value={stepsInput}
        onChangeText={onStepsChange}
        keyboardType="number-pad"
        placeholder="Ex.: 3300"
        placeholderTextColor={colors.textSubtle}
        style={styles.stepsInput}
      />

      <PrimaryButton label="Salvar caminhada" onPress={onSubmit} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  heroLottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroLottie: {
    width: LOTTIE_SIZE + 40,
    height: LOTTIE_SIZE + 20,
  },
  fieldIconOrb: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 2,
  },
  headerTextCol: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeButtonPressed: {
    opacity: 0.8,
  },
  scrollContent: {
    paddingBottom: 8,
    gap: 12,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  currentCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.28)',
  },
  currentSteps: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 44,
    fontVariant: ['tabular-nums'],
  },
  currentGoalMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 10,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  currentFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  zoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zoneLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryMetric: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryMetricDot: {
    color: colors.textSubtle,
    fontSize: 12,
  },
  periodTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  periodTabSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(110, 231, 183, 0.35)',
  },
  periodTabPressed: {
    opacity: 0.88,
  },
  periodTabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  periodTabTextSelected: {
    color: '#6ee7b7',
  },
  summaryCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryStatLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryStatValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  summaryStatValueHighlight: {
    color: '#6ee7b7',
  },
  summaryStatUnit: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  summaryTotal: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  summaryHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 6,
  },
  historyCard: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  historyDateCol: {
    width: 72,
    gap: 2,
  },
  historyDate: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  historySource: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
  },
  historyStepsCol: {
    flex: 1,
    gap: 6,
  },
  historySteps: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  historyProgressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  historyProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#6ee7b7',
  },
  historyProgressFillDone: {
    backgroundColor: '#34d399',
  },
  historyMetaCol: {
    width: 56,
    alignItems: 'flex-end',
    gap: 4,
  },
  goalHitBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  goalPercent: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  peakHint: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'right',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyListText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    paddingBottom: 10,
  },
  connectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.18)',
  },
  connectBannerText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  connectBannerAction: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 4,
    gap: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  secondaryButton: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  secondaryButtonInline: {
    marginTop: 0,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonPressed: {
    opacity: 0.86,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  manualForm: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  manualFormTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  manualFormHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  durationChipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(110, 231, 183, 0.35)',
  },
  durationChipPressed: {
    opacity: 0.88,
  },
  durationChipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  durationChipTextSelected: {
    color: '#6ee7b7',
  },
  stepsInput: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
})
