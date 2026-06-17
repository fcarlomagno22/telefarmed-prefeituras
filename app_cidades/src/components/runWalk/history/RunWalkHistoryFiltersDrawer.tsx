import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import {
  DEFAULT_RUN_WALK_HISTORY_FILTERS,
  type RunWalkHistoryAdvancedFilters,
  type RunWalkHistoryDateRange,
  type RunWalkHistoryPeriod,
  type RunWalkHistorySort,
} from '../../../types/runWalkHistory'
import { formatHistoryPeriodLabel } from '../../../utils/runWalkHistoryStats'
import { PrimaryButton } from '../../PrimaryButton'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'
import { RunWalkHistoryPeriodCalendarDrawer } from './RunWalkHistoryPeriodCalendarDrawer'

export type RunWalkHistoryFiltersState = {
  period: RunWalkHistoryPeriod
  sort: RunWalkHistorySort
  advanced: RunWalkHistoryAdvancedFilters
  customRange: RunWalkHistoryDateRange | null
}

type RunWalkHistoryFiltersDrawerProps = {
  visible: boolean
  period: RunWalkHistoryPeriod
  sort: RunWalkHistorySort
  filters: RunWalkHistoryAdvancedFilters
  customRange: RunWalkHistoryDateRange | null
  activityDateKeys?: ReadonlySet<string>
  onClose: () => void
  onApply: (next: RunWalkHistoryFiltersState) => void
}

const PERIOD_OPTIONS: Array<{ id: RunWalkHistoryPeriod; label: string; opensCalendar?: boolean }> =
  [
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: '90d', label: '90 dias' },
    { id: 'all', label: 'Tudo' },
    { id: 'custom', label: 'Personalizado', opensCalendar: true },
  ]

const SORT_OPTIONS: Array<{ id: RunWalkHistorySort; label: string }> = [
  { id: 'recent', label: 'Mais recente' },
  { id: 'distance', label: 'Maior distância' },
  { id: 'duration', label: 'Mais longo' },
]

const DISTANCE_PRESETS = [0, 1, 2, 3, 5]

const DEFAULT_PERIOD: RunWalkHistoryPeriod = '30d'
const DEFAULT_SORT: RunWalkHistorySort = 'recent'

export function countRunWalkHistoryActiveFilters(
  period: RunWalkHistoryPeriod,
  sort: RunWalkHistorySort,
  filters: RunWalkHistoryAdvancedFilters,
  customRange: RunWalkHistoryDateRange | null,
) {
  let count = 0
  if (period !== DEFAULT_PERIOD) count += 1
  if (sort !== DEFAULT_SORT) count += 1
  if (filters.minDistanceKm !== DEFAULT_RUN_WALK_HISTORY_FILTERS.minDistanceKm) count += 1
  if (period === 'custom' && customRange) count += 0
  return count
}

export function RunWalkHistoryFiltersDrawer({
  visible,
  period,
  sort,
  filters,
  customRange,
  activityDateKeys,
  onClose,
  onApply,
}: RunWalkHistoryFiltersDrawerProps) {
  const [draftPeriod, setDraftPeriod] = useState(period)
  const [draftSort, setDraftSort] = useState(sort)
  const [draftAdvanced, setDraftAdvanced] = useState(filters)
  const [draftCustomRange, setDraftCustomRange] = useState<RunWalkHistoryDateRange | null>(customRange)
  const [calendarVisible, setCalendarVisible] = useState(false)

  useEffect(() => {
    if (!visible) return
    setDraftPeriod(period)
    setDraftSort(sort)
    setDraftAdvanced(filters)
    setDraftCustomRange(customRange)
  }, [customRange, filters, period, sort, visible])

  function handleApply() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onApply({
      period: draftPeriod,
      sort: draftSort,
      advanced: draftAdvanced,
      customRange: draftPeriod === 'custom' ? draftCustomRange : null,
    })
    onClose()
  }

  function handleReset() {
    setDraftPeriod(DEFAULT_PERIOD)
    setDraftSort(DEFAULT_SORT)
    setDraftAdvanced(DEFAULT_RUN_WALK_HISTORY_FILTERS)
    setDraftCustomRange(null)
  }

  function handlePeriodPress(option: (typeof PERIOD_OPTIONS)[number]) {
    if (option.opensCalendar) {
      setDraftPeriod('custom')
      setCalendarVisible(true)
      return
    }

    setDraftPeriod(option.id)
    if (option.id !== 'custom') {
      setDraftCustomRange(null)
    }
  }

  const customPeriodLabel =
    draftPeriod === 'custom' && draftCustomRange
      ? formatHistoryPeriodLabel('custom', draftCustomRange)
      : null

  return (
    <>
      <RunWalkSheetDrawer
        visible={visible}
        title="Filtros avançados"
        subtitle="Período, ordenação e distância"
        onClose={onClose}
        footer={
          <View style={styles.footer}>
            <Pressable onPress={handleReset} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Limpar filtros</Text>
            </Pressable>
            <PrimaryButton label="Aplicar filtros" onPress={handleApply} />
          </View>
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Período</Text>
          <View style={styles.chips}>
            {PERIOD_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                active={draftPeriod === option.id}
                onPress={() => handlePeriodPress(option)}
              />
            ))}
          </View>
          {customPeriodLabel ? (
            <Text style={styles.customRangeHint}>{customPeriodLabel}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ordenação</Text>
          <View style={styles.chips}>
            {SORT_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                active={draftSort === option.id}
                onPress={() => setDraftSort(option.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distância mínima</Text>
          <View style={styles.chips}>
            {DISTANCE_PRESETS.map((distance) => (
              <Chip
                key={distance}
                label={distance === 0 ? 'Qualquer' : `${distance} km+`}
                active={draftAdvanced.minDistanceKm === distance}
                onPress={() =>
                  setDraftAdvanced((current) => ({ ...current, minDistanceKm: distance }))
                }
              />
            ))}
          </View>
        </View>
      </RunWalkSheetDrawer>

      <RunWalkHistoryPeriodCalendarDrawer
        visible={calendarVisible}
        range={draftCustomRange}
        markedDateKeys={activityDateKeys}
        onClose={() => setCalendarVisible(false)}
        onApply={(range) => {
          setDraftCustomRange(range)
          setDraftPeriod('custom')
          setCalendarVisible(false)
        }}
      />
    </>
  )
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customRangeHint: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '600',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(16, 185, 129, 0.38)',
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#6ee7b7',
    fontWeight: '700',
  },
  footer: {
    gap: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
})
