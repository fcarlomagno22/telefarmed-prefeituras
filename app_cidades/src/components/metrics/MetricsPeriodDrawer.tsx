import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { PeriodPreset, PeriodSelection } from '../../types/metrics'
import {
  buildPeriodSelection,
  formatDateKey,
  formatPeriodLabel,
} from '../../utils/metricsPeriod'
import { PrimaryButton } from '../PrimaryButton'
import { WaveTitle } from '../WaveTitle'

type MetricsPeriodDrawerProps = {
  visible: boolean
  period: PeriodSelection
  onClose: () => void
  onApply: (period: PeriodSelection) => void
  subtitle?: string
  title?: string
  markedDateKeys?: ReadonlySet<string>
}

const PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'week', label: 'Essa semana' },
  { id: 'month', label: 'Este mês' },
  { id: 'last30days', label: 'Últimos 30 dias' },
]

const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const SHEET_OFFSET = 520

function startOfMonth(date: Date) {
  const next = new Date(date)
  next.setDate(1)
  next.setHours(12, 0, 0, 0)
  return next
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

function buildMonthGrid(monthDate: Date) {
  const firstDay = startOfMonth(monthDate)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate()

  const cells: Array<{ date: Date | null; key: string }> = []
  for (let index = 0; index < startWeekday; index += 1) {
    cells.push({ date: null, key: `empty-start-${index}` })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day, 12, 0, 0, 0)
    cells.push({ date, key: formatDateKey(date) })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: `empty-end-${cells.length}` })
  }
  return cells
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isBetween(date: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false
  const time = date.getTime()
  return time >= start.getTime() && time <= end.getTime()
}

export function MetricsPeriodDrawer({
  visible,
  period,
  onClose,
  onApply,
  subtitle = 'Escolha como deseja visualizar a evolução',
  title = 'Período',
  markedDateKeys,
}: MetricsPeriodDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [draftPreset, setDraftPreset] = useState<PeriodPreset>(period.preset)
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(period.start))
  const [rangeStart, setRangeStart] = useState<Date | null>(period.start)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(period.end)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const monthCells = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth])
  const monthTitle = visibleMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    if (visible) {
      setDraftPreset(period.preset)
      setVisibleMonth(startOfMonth(period.start))
      setRangeStart(period.start)
      setRangeEnd(period.end)
      setIsMounted(true)
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
      return
    }

    if (isMounted) {
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

  function handlePresetPress(preset: PeriodPreset) {
    setDraftPreset(preset)
    const next = buildPeriodSelection(preset)
    setRangeStart(next.start)
    setRangeEnd(next.end)
    setVisibleMonth(startOfMonth(next.start))
  }

  function handleDayPress(date: Date) {
    setDraftPreset('custom')

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date)
      setRangeEnd(null)
      return
    }

    if (date.getTime() < rangeStart.getTime()) {
      setRangeEnd(rangeStart)
      setRangeStart(date)
      return
    }

    setRangeEnd(date)
  }

  function handleApply() {
    const nextPeriod = buildPeriodSelection(draftPreset, rangeStart ?? undefined, rangeEnd ?? undefined)
    onApply(nextPeriod)
    handleDismiss()
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
              paddingBottom: Math.max(insets.bottom, 16) + 8,
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

          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <WaveTitle text={title} />
            </View>
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar seletor de período"
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.presetRow}>
            {PRESETS.map((preset) => {
              const active = draftPreset === preset.id
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handlePresetPress(preset.id)}
                  style={({ pressed }) => [
                    styles.presetChip,
                    active && styles.presetChipActive,
                    pressed && styles.presetChipPressed,
                  ]}
                >
                  <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Pressable
                onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                style={({ pressed }) => [styles.monthNavButton, pressed && styles.monthNavPressed]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>

              <Text style={styles.monthTitle}>{monthTitle}</Text>

              <Pressable
                onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                style={({ pressed }) => [styles.monthNavButton, pressed && styles.monthNavPressed]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, index) => (
                <Text key={`${label}-${index}`} style={styles.weekdayLabel}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {monthCells.map((cell) => {
                if (!cell.date) {
                  return <View key={cell.key} style={styles.dayCell} />
                }

                const selectedStart = rangeStart && isSameDay(cell.date, rangeStart)
                const selectedEnd = rangeEnd && isSameDay(cell.date, rangeEnd)
                const inRange = isBetween(cell.date, rangeStart, rangeEnd)
                const isFuture = cell.date.getTime() > Date.now()
                const hasMarker = markedDateKeys?.has(formatDateKey(cell.date)) ?? false

                return (
                  <Pressable
                    key={cell.key}
                    disabled={isFuture}
                    onPress={() => handleDayPress(cell.date!)}
                    style={({ pressed }) => [
                      styles.dayCell,
                      isFuture && styles.dayCellDisabled,
                      pressed && !isFuture && styles.dayCellPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.dayCellContent,
                        inRange && styles.dayCellInRange,
                        (selectedStart || selectedEnd) && styles.dayCellSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayLabel,
                          (selectedStart || selectedEnd) && styles.dayLabelSelected,
                          isFuture && styles.dayLabelDisabled,
                        ]}
                        {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
                      >
                        {cell.date.getDate()}
                      </Text>
                      {hasMarker ? (
                        <View
                          style={[
                            styles.markerDot,
                            (selectedStart || selectedEnd) && styles.markerDotSelected,
                          ]}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Text style={styles.rangeHint}>
            {draftPreset === 'custom'
              ? rangeEnd
                ? `Intervalo: ${formatPeriodLabel(buildPeriodSelection('custom', rangeStart ?? undefined, rangeEnd))}`
                : 'Toque no dia inicial e depois no dia final'
              : `Selecionado: ${formatPeriodLabel(buildPeriodSelection(draftPreset))}`}
          </Text>

          <PrimaryButton label="Aplicar período" onPress={handleApply} />
        </Animated.View>
      </View>
    </AppModal>
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
    paddingTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleWrap: {
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 14,
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
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetChipActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.18)',
    borderColor: 'rgba(255, 133, 51, 0.55)',
  },
  presetChipPressed: {
    opacity: 0.86,
  },
  presetChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: colors.primaryLight,
  },
  calendarCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  monthNavPressed: {
    opacity: 0.82,
  },
  monthTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    padding: 2,
  },
  dayCellContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 2,
    paddingVertical: 2,
  },
  dayCellInRange: {
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderRadius: 8,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(255, 107, 0, 0.88)',
    borderRadius: 8,
  },
  dayCellDisabled: {
    opacity: 0.28,
  },
  dayCellPressed: {
    transform: [{ scale: 0.96 }],
  },
  dayLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 14,
    textAlign: 'center',
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
  },
  dayLabelSelected: {
    color: '#fff',
    fontWeight: '800',
    lineHeight: 14,
  },
  dayLabelDisabled: {
    color: colors.textSubtle,
  },
  markerDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#c4b5fd',
  },
  markerDotSelected: {
    backgroundColor: '#fff',
  },
  rangeHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 14,
    textAlign: 'center',
  },
})
