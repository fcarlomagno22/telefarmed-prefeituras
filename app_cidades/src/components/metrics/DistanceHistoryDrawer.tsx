import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import walkingAnimation from '../../../assets/walking.json'
import {
  DEFAULT_DISTANCE_GOAL_KM,
  estimateCalories,
  estimateDistanceKm,
  estimateStepsFromDuration,
  filterStepsByPeriod,
  formatDistanceKm,
  formatDistanceKmLabel,
  formatStepsCount,
  formatStepsDayLabel,
  getDistanceGoalStatus,
  getDistanceRecordSourceLabel,
  getTodayDistanceKm,
  getTodayDistanceSourceLabel,
  getTodaySteps,
  summarizeDistancePeriod,
} from '../../data/mockStepsHistory'
import { colors } from '../../theme/colors'
import { ManualWalkEntry, StepsDayRecord, StepsPeriod } from '../../types/steps'
import { PrimaryButton } from '../PrimaryButton'

const SHEET_OFFSET = 620
const DISTANCE_GRADIENT = ['#93c5fd', '#2563eb', '#1d4ed8'] as const
const PERIOD_OPTIONS: { id: StepsPeriod; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
]
const DURATION_OPTIONS = [15, 30, 45, 60]

type DistanceHistoryDrawerProps = {
  visible: boolean
  onClose: () => void
  records: StepsDayRecord[]
  hasIntegration: boolean
  hasDistanceSync: boolean
  onConnectPress: () => void
  onManualWalk: (entry: ManualWalkEntry) => void
  onViewStepsPress: () => void
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
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryStatLabel}>{label}</Text>
      <Text style={[styles.summaryStatValue, highlight && styles.summaryStatValueHighlight]}>
        {value}
      </Text>
    </View>
  )
}

function DayRow({
  record,
  hasDistanceSync,
}: {
  record: StepsDayRecord
  hasDistanceSync: boolean
}) {
  const distanceKm = estimateDistanceKm(record.steps)

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyDateCol}>
        <Text style={styles.historyDate}>{formatStepsDayLabel(record.date)}</Text>
        <Text style={styles.historySource}>
          {getDistanceRecordSourceLabel(record.source, hasDistanceSync)}
        </Text>
      </View>

      <View style={styles.historyDistanceCol}>
        <Text style={styles.historyDistance}>{formatDistanceKm(distanceKm)}</Text>
        <Text style={styles.historyDistanceUnit}>km</Text>
      </View>
    </View>
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
  const estimatedKm = formatDistanceKmLabel(estimateDistanceKm(Number(stepsInput) || 0))

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
      <Text style={styles.manualFormEstimate}>≈ {estimatedKm}</Text>

      <PrimaryButton label="Salvar caminhada" onPress={onSubmit} />
    </View>
  )
}

export function DistanceHistoryDrawer({
  visible,
  onClose,
  records,
  hasIntegration,
  hasDistanceSync,
  onConnectPress,
  onManualWalk,
  onViewStepsPress,
}: DistanceHistoryDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [period, setPeriod] = useState<StepsPeriod>('today')
  const [manualFormOpen, setManualFormOpen] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [stepsInput, setStepsInput] = useState(String(estimateStepsFromDuration(30)))

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const todaySteps = getTodaySteps(records)
  const todayDistanceKm = getTodayDistanceKm(records)
  const goalStatus = getDistanceGoalStatus(todayDistanceKm)
  const dataSourceLabel = getTodayDistanceSourceLabel(records, hasDistanceSync)
  const showEmpty = !hasIntegration && records.length === 0

  const periodRecords = useMemo(
    () => filterStepsByPeriod(records, period),
    [records, period],
  )
  const summary = useMemo(
    () => summarizeDistancePeriod(records, period),
    [records, period],
  )

  const periodTotalLabel =
    period === 'today' ? 'Hoje' : period === 'week' ? '7 dias' : '30 dias'

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      setManualFormOpen(false)
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

  function handlePeriodChange(next: StepsPeriod) {
    void Haptics.selectionAsync()
    setPeriod(next)
  }

  function handleConnectPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    closeSheet(() => {
      onClose()
      onConnectPress()
    })
  }

  function handleViewStepsPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    closeSheet(() => {
      onClose()
      onViewStepsPress()
    })
  }

  function handleDurationSelect(minutes: number) {
    setDurationMinutes(minutes)
    setStepsInput(String(estimateStepsFromDuration(minutes)))
  }

  function handleRegisterWalk() {
    const steps = Number(stepsInput.replace(/\D/g, ''))
    if (!Number.isFinite(steps) || steps <= 0) return

    onManualWalk({ durationMinutes, steps })
    setManualFormOpen(false)
    setDurationMinutes(30)
    setStepsInput(String(estimateStepsFromDuration(30)))
  }

  if (!isMounted) return null

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 8,
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
            colors={[...DISTANCE_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topAccent}
          />

          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <LinearGradient
              colors={[...DISTANCE_GRADIENT]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.fieldIconOrb}
            >
              <MaterialCommunityIcons name="map-marker-distance" size={22} color="#fff" />
            </LinearGradient>

            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Distância</Text>
              <Text style={styles.subtitle}>
                {showEmpty
                  ? 'Conecte um app de saúde para sincronizar'
                  : 'Quanto você se moveu hoje'}
              </Text>
            </View>

            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar distância"
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.lottieWrap}>
            <LottieView source={walkingAnimation} autoPlay loop style={styles.lottieAnimation} />
          </View>

          {showEmpty ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhuma distância registrada</Text>
              <Text style={styles.emptyBody}>
                Conecte o Apple Health ou Health Connect para importar distância do relógio ou
                celular, ou registre uma caminhada manualmente.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.metricsRow}>
                <View style={styles.valueCard}>
                  <Text style={styles.cardLabel}>Distância hoje</Text>
                  <Text style={styles.valueText}>{formatDistanceKm(todayDistanceKm)}</Text>
                  <Text style={styles.valueUnit}>km</Text>
                </View>

                <View
                  style={[
                    styles.zoneCard,
                    { backgroundColor: goalStatus.bg, borderColor: goalStatus.border },
                  ]}
                >
                  <Text style={styles.cardLabel}>Meta do dia</Text>
                  <View style={styles.zoneBadgeRow}>
                    <View style={[styles.zoneDot, { backgroundColor: goalStatus.color }]} />
                    <Text style={[styles.zoneLabel, { color: goalStatus.color }]}>
                      {goalStatus.label}
                    </Text>
                  </View>
                  <Text style={[styles.zoneMeta, { color: goalStatus.color }]}>
                    {formatDistanceKmLabel(DEFAULT_DISTANCE_GOAL_KM, 0)} · meta
                  </Text>
                </View>
              </View>

              <View style={styles.sourceCard}>
                <Text style={styles.sourceCardLabel}>Origem dos dados</Text>
                <Text style={styles.sourceCardValue}>{dataSourceLabel}</Text>
                <Text style={styles.sourceCardHint}>
                  {hasDistanceSync
                    ? 'Distância sincronizada do app de saúde conectado.'
                    : 'Estimativa a partir dos passos (~0,76 m por passo).'}
                </Text>

                <View style={styles.contextRow}>
                  <View style={styles.contextItem}>
                    <MaterialCommunityIcons name="walk" size={16} color="#93c5fd" />
                    <Text style={styles.contextValue}>{formatStepsCount(todaySteps)}</Text>
                    <Text style={styles.contextLabel}>passos</Text>
                  </View>
                  <View style={styles.contextDivider} />
                  <View style={styles.contextItem}>
                    <MaterialCommunityIcons name="fire" size={16} color="#93c5fd" />
                    <Text style={styles.contextValue}>{estimateCalories(todaySteps)}</Text>
                    <Text style={styles.contextLabel}>kcal</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {!showEmpty ? (
              <>
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
                    <SummaryStat label="Mín/dia" value={formatDistanceKm(summary.min)} />
                    <SummaryStat
                      label="Média/dia"
                      value={formatDistanceKm(summary.avg)}
                      highlight
                    />
                    <SummaryStat label="Máx/dia" value={formatDistanceKm(summary.max)} />
                  </View>
                  <Text style={styles.summaryTotal}>
                    {formatDistanceKmLabel(summary.total)} no período
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
                        <DayRow record={record} hasDistanceSync={hasDistanceSync} />
                        {index < periodRecords.length - 1 ? (
                          <View style={styles.rowDivider} />
                        ) : null}
                      </View>
                    ))
                  )}
                </View>
              </>
            ) : null}

            {!hasIntegration ? (
              <View style={styles.connectBanner}>
                <MaterialCommunityIcons name="link-variant" size={18} color="#93c5fd" />
                <Text style={styles.connectBannerText}>
                  Conecte um app de saúde para distância mais precisa.
                </Text>
                <Pressable onPress={handleConnectPress} hitSlop={8}>
                  <Text style={styles.connectBannerAction}>Conectar</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <View style={styles.primaryActionWrap}>
                <PrimaryButton
                  label={
                    showEmpty
                      ? 'Conectar saúde'
                      : manualFormOpen
                        ? 'Fechar formulário'
                        : 'Registrar caminhada'
                  }
                  onPress={
                    showEmpty
                      ? handleConnectPress
                      : () => setManualFormOpen((open) => !open)
                  }
                />
              </View>
              {!showEmpty ? (
                <Pressable
                  onPress={handleViewStepsPress}
                  style={({ pressed }) => [
                    styles.secondaryAction,
                    pressed && styles.secondaryActionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Ver passos"
                >
                  <MaterialCommunityIcons name="walk" size={18} color="#93c5fd" />
                  <Text style={styles.secondaryActionText}>Passos</Text>
                </Pressable>
              ) : null}
            </View>

            {showEmpty && !manualFormOpen ? (
              <Pressable
                onPress={() => setManualFormOpen(true)}
                style={({ pressed }) => [
                  styles.linkButton,
                  pressed && styles.linkButtonPressed,
                ]}
              >
                <Text style={styles.linkButtonText}>Ou registrar caminhada manualmente</Text>
              </Pressable>
            ) : null}

            {manualFormOpen ? (
              <ManualWalkForm
                durationMinutes={durationMinutes}
                stepsInput={stepsInput}
                onDurationSelect={handleDurationSelect}
                onStepsChange={setStepsInput}
                onSubmit={handleRegisterWalk}
              />
            ) : null}

            <Text style={styles.disclaimer}>
              A estimativa por passos usa passada média de ~0,76 m. Pode variar conforme altura e
              ritmo.
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
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
    marginBottom: 4,
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
  lottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 108,
    marginBottom: 10,
  },
  lottieAnimation: {
    width: 150,
    height: 108,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  valueCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  zoneCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 96,
    gap: 6,
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  valueText: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    lineHeight: 40,
    marginTop: 4,
  },
  valueUnit: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  zoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  zoneDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  zoneLabel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  zoneMeta: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
  },
  sourceCard: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  sourceCardLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sourceCardValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sourceCardHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    marginBottom: 6,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  contextItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  contextValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  contextLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contextDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  periodTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  periodTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  periodTabSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderColor: 'rgba(147, 197, 253, 0.35)',
  },
  periodTabPressed: {
    opacity: 0.85,
  },
  periodTabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  periodTabTextSelected: {
    color: '#93c5fd',
  },
  summaryCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
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
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  summaryStatValueHighlight: {
    color: '#93c5fd',
  },
  summaryTotal: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
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
    marginBottom: 12,
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
    flex: 1,
    gap: 2,
  },
  historyDate: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  historySource: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
  },
  historyDistanceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  historyDistance: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  historyDistanceUnit: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyListText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    paddingBottom: 8,
  },
  connectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.18)',
  },
  connectBannerText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  connectBannerAction: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 8,
  },
  primaryActionWrap: {
    flex: 1,
  },
  secondaryAction: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.22)',
    paddingVertical: 10,
  },
  secondaryActionPressed: {
    opacity: 0.82,
  },
  secondaryActionText: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  linkButtonPressed: {
    opacity: 0.8,
  },
  linkButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  manualForm: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  manualFormTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  manualFormHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderColor: 'rgba(147, 197, 253, 0.35)',
  },
  durationChipPressed: {
    opacity: 0.85,
  },
  durationChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  durationChipTextSelected: {
    color: '#93c5fd',
  },
  stepsInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  manualFormEstimate: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  disclaimer: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
})
