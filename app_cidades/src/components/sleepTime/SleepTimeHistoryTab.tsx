import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { loadSleepLogs } from '../../data/sleepLogStorage'
import { colors } from '../../theme/colors'
import type { SleepCalendarDay } from '../../types/sleepHistory'
import type { SleepLogEntry } from '../../types/sleepLog'
import { getEatWellMonthLabel } from '../../utils/eatWellCalendarDays'
import { formatSleepLogShortDateLabel } from '../../utils/sleepLogFormat'
import {
  attachSleepCalendarDayFlags,
  buildSleepMonthDays,
  buildSleepWeekSummary,
  buildSleepMonthDayStats,
  filterEntriesForDate,
  indexSleepLogsByDay,
  mapSleepDayStatsToWeeklyChartDays,
} from '../../utils/sleepHistoryStats'
import { RunWalkWeeklyBarChart } from '../runWalk/RunWalkWeeklyBarChart'
import { SleepTimeDayStrip } from './history/SleepTimeDayStrip'
import { SleepTimeHistoryComboChart } from './history/SleepTimeHistoryComboChart'
import { SleepTimeHistoryEntryList } from './history/SleepTimeHistoryEntryList'
import { SleepTimeHistoryHero } from './history/SleepTimeHistoryHero'
import { SleepTimeHistoryHighlights } from './history/SleepTimeHistoryHighlights'
import { SleepTimeHistoryQualityHeatmap } from './history/SleepTimeHistoryQualityHeatmap'
import { SleepTimeHistoryQualityRing } from './history/SleepTimeHistoryQualityRing'

const SLEEP_TARGET_MINUTES = 8 * 60

type SleepTimeHistoryTabProps = {
  bottomPadding: number
  patientCpf: string
  refreshKey: number
  isActive?: boolean
  calendarMonthKey: string
  selectedDateIso: string
  onSelectDate: (dateIso: string) => void
  onOpenMonthPicker: () => void
  onHorizontalScrollActive?: (active: boolean) => void
}

export function SleepTimeHistoryTab({
  bottomPadding,
  patientCpf,
  refreshKey,
  isActive = true,
  calendarMonthKey,
  selectedDateIso,
  onSelectDate,
  onOpenMonthPicker,
  onHorizontalScrollActive,
}: SleepTimeHistoryTabProps) {
  const { width } = useWindowDimensions()
  const [entries, setEntries] = useState<SleepLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const nextEntries = await loadSleepLogs(patientCpf)
      if (cancelled) return
      setEntries(nextEntries)
      setIsLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [patientCpf, refreshKey])

  const calendarDays = useMemo<SleepCalendarDay[]>(() => {
    const days = buildSleepMonthDays(calendarMonthKey)
    const entriesByDay = indexSleepLogsByDay(entries)
    return attachSleepCalendarDayFlags(days, entriesByDay)
  }, [calendarMonthKey, entries])

  const weekSummary = useMemo(
    () => buildSleepWeekSummary(entries, new Date(), selectedDateIso),
    [entries, selectedDateIso],
  )

  const monthDayStats = useMemo(
    () => buildSleepMonthDayStats(entries, calendarMonthKey),
    [entries, calendarMonthKey],
  )

  const monthChartDays = useMemo(
    () => mapSleepDayStatsToWeeklyChartDays(monthDayStats),
    [monthDayStats],
  )

  const selectedDayEntries = useMemo(
    () => filterEntriesForDate(entries, selectedDateIso),
    [entries, selectedDateIso],
  )

  const hasAnyEntries = entries.length > 0
  const monthLabel = getEatWellMonthLabel(calendarMonthKey)
  const entryListTitle = `Registros · ${formatSleepLogShortDateLabel(selectedDateIso)}`

  async function handleRefresh() {
    setIsRefreshing(true)
    const nextEntries = await loadSleepLogs(patientCpf)
    setEntries(nextEntries)
    setIsRefreshing(false)
  }

  function handleSelectDay(dateIso: string) {
    onSelectDate(dateIso)
  }

  if (isLoading) {
    return (
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <SleepTimeDayStrip
          days={calendarDays}
          monthKey={calendarMonthKey}
          selectedDateIso={selectedDateIso}
          onSelectDate={onSelectDate}
          onOpenMonthPicker={onOpenMonthPicker}
          onHorizontalScrollActive={onHorizontalScrollActive}
        />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Carregando histórico...</Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => void handleRefresh()}
          tintColor="#a5b4fc"
        />
      }
    >
      <SleepTimeDayStrip
        days={calendarDays}
        monthKey={calendarMonthKey}
        selectedDateIso={selectedDateIso}
        onSelectDate={onSelectDate}
        onOpenMonthPicker={onOpenMonthPicker}
        onHorizontalScrollActive={onHorizontalScrollActive}
      />

      {!hasAnyEntries ? (
        <View style={styles.emptyWrap}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="sleep" size={34} color="#a5b4fc" />
          </View>
          <Text style={styles.emptyTitle}>Seu histórico de sono aparece aqui</Text>
          <Text style={styles.emptyText}>
            Toque no botão + para registrar suas noites e acompanhar horas dormidas, qualidade do
            descanso e evolução ao longo do tempo.
          </Text>
        </View>
      ) : (
        <>
          <SleepTimeHistoryHero summary={weekSummary} animate={isActive} />
          <SleepTimeHistoryQualityRing summary={weekSummary} animate={isActive} />
          <SleepTimeHistoryComboChart
            summary={weekSummary}
            width={width}
            animate={isActive}
            selectedDateIso={selectedDateIso}
            onSelectDay={handleSelectDay}
          />

          <View style={styles.monthChartSection}>
            <Text style={styles.sectionTitle}>Horas dormidas em {monthLabel}</Text>
            <RunWalkWeeklyBarChart
              days={monthChartDays}
              width={width - 32}
              targetMinutesPerDay={SLEEP_TARGET_MINUTES}
              selectedDateIso={selectedDateIso}
              onSelectDay={handleSelectDay}
              layoutMode="chronological"
              scrollable
              visibleBars={7}
              showLegend
              animate={isActive}
            />
          </View>

          <SleepTimeHistoryQualityHeatmap
            summary={weekSummary}
            selectedDateIso={selectedDateIso}
            onSelectDay={handleSelectDay}
          />

          <SleepTimeHistoryHighlights
            highlights={weekSummary.highlights}
            onPressHighlight={(highlight) => handleSelectDay(highlight.dateIso)}
            onHorizontalScrollActive={onHorizontalScrollActive}
          />

          <SleepTimeHistoryEntryList
            entries={selectedDayEntries}
            title={entryListTitle}
            emptyMessage="Nenhum registro para este dia. Toque no + para registrar sua noite."
          />
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  content: {
    gap: 14,
    paddingTop: 4,
  },
  loadingWrap: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyWrap: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.24)',
    marginBottom: 4,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
  },
  monthChartSection: {
    paddingHorizontal: 16,
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
})
