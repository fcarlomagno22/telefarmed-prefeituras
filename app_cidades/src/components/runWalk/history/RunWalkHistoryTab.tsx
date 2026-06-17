import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import {
  ensureRunWalkHistorySeeded,
  getActivityDateIso,
  loadRunWalkActivityHistory,
} from '../../../data/runWalkActivityHistoryStorage'
import type { RunWalkActivitySummary } from '../../../data/runWalkActivitySummaryStorage'
import { colors } from '../../../theme/colors'
import type { WeeklyGoalStats } from '../../../types/runWalk'
import {
  DEFAULT_RUN_WALK_HISTORY_FILTERS,
  type RunWalkHistoryAdvancedFilters,
  type RunWalkHistoryDateRange,
  type RunWalkHistoryHighlight,
  type RunWalkHistoryPeriod,
  type RunWalkHistorySort,
} from '../../../types/runWalkHistory'
import { shareRunWalkHistoryReportPdf } from '../../../utils/runWalkHistoryReportPdf'
import { resolveRunWalkHistoryAnimation } from '../../../utils/runWalkHistoryAnimation'
import {
  buildHistoryChartDaysForPeriod,
  buildHistoryHeatmap,
  buildHistoryTrendPoints,
  computeHistoryHighlights,
  computeHistoryPeriodSummary,
  filterHistoryActivities,
  getHistoryChartSectionTitle,
  sortHistoryActivities,
} from '../../../utils/runWalkHistoryStats'
import { RunWalkWeeklyBarChart } from '../RunWalkWeeklyBarChart'
import { RunWalkHistoryActivityDrawer } from './RunWalkHistoryActivityDrawer'
import { RunWalkHistoryEmptyState } from './RunWalkHistoryEmptyState'
import { RunWalkHistoryFeed } from './RunWalkHistoryFeed'
import { RunWalkHistoryFiltersBar } from './RunWalkHistoryFiltersBar'
import {
  countRunWalkHistoryActiveFilters,
  RunWalkHistoryFiltersDrawer,
} from './RunWalkHistoryFiltersDrawer'
import { RunWalkHistoryHeatmap } from './RunWalkHistoryHeatmap'
import { RunWalkHistoryHighlightsRow } from './RunWalkHistoryHighlightsRow'
import { RunWalkHistoryRevealSection } from './RunWalkHistoryRevealSection'
import { RunWalkHistoryShareDrawer } from './RunWalkHistoryShareDrawer'
import { RunWalkHistorySummaryCard } from './RunWalkHistorySummaryCard'
import { RunWalkHistoryTrendChart } from './RunWalkHistoryTrendChart'

type RunWalkHistoryTabProps = {
  patientCpf: string
  patientName?: string | null
  profilePhotoUri?: string | null
  weeklyGoalStats: WeeklyGoalStats
  bottomPadding: number
  isActive?: boolean
  onStartActivity: () => void
  onSegmentPagerLockChange?: (active: boolean) => void
}

export function RunWalkHistoryTab({
  patientCpf,
  patientName,
  profilePhotoUri,
  weeklyGoalStats,
  bottomPadding,
  isActive = true,
  onStartActivity,
  onSegmentPagerLockChange,
}: RunWalkHistoryTabProps) {
  const { width } = useWindowDimensions()
  const chartWidth = width - 32

  const [activities, setActivities] = useState<RunWalkActivitySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [exportingReport, setExportingReport] = useState(false)
  const [period, setPeriod] = useState<RunWalkHistoryPeriod>('30d')
  const [customDateRange, setCustomDateRange] = useState<RunWalkHistoryDateRange | null>(null)
  const [sort, setSort] = useState<RunWalkHistorySort>('recent')
  const [advancedFilters, setAdvancedFilters] = useState<RunWalkHistoryAdvancedFilters>(
    DEFAULT_RUN_WALK_HISTORY_FILTERS,
  )
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null)

  const [selectedActivity, setSelectedActivity] = useState<RunWalkActivitySummary | null>(null)
  const [activityDrawerVisible, setActivityDrawerVisible] = useState(false)
  const [shareDrawerVisible, setShareDrawerVisible] = useState(false)
  const [filtersDrawerVisible, setFiltersDrawerVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const targetMinutesPerDay =
    weeklyGoalStats.targetMovementDays > 0
      ? Math.round(weeklyGoalStats.targetActiveMinutes / weeklyGoalStats.targetMovementDays)
      : 30
  const targetActiveMinutes = weeklyGoalStats.targetActiveMinutes
  const targetDistanceKm = Math.max(8, (targetActiveMinutes / 30) * 2.5)

  const loadHistory = useCallback(async () => {
    await ensureRunWalkHistorySeeded(patientCpf)
    const loaded = await loadRunWalkActivityHistory(patientCpf)
    setActivities(loaded)
    setIsLoading(false)
  }, [patientCpf])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  useEffect(() => {
    return () => {
      onSegmentPagerLockChange?.(false)
    }
  }, [onSegmentPagerLockChange])

  const activityDateKeys = useMemo(
    () => new Set(activities.map((activity) => getActivityDateIso(activity))),
    [activities],
  )

  const periodFilteredActivities = useMemo(
    () =>
      filterHistoryActivities(
        activities,
        period,
        advancedFilters,
        selectedDateIso,
        new Date(),
        customDateRange,
      ),
    [activities, advancedFilters, customDateRange, period, selectedDateIso],
  )

  const sortedActivities = useMemo(
    () => sortHistoryActivities(periodFilteredActivities, sort),
    [periodFilteredActivities, sort],
  )

  const summary = useMemo(
    () => computeHistoryPeriodSummary(activities, period, new Date(), customDateRange),
    [activities, customDateRange, period],
  )

  const chartDays = useMemo(
    () =>
      buildHistoryChartDaysForPeriod(
        filterHistoryActivities(activities, period, advancedFilters, null, new Date(), customDateRange),
        period,
        'minutes',
        new Date(),
        customDateRange,
      ),
    [activities, advancedFilters, customDateRange, period],
  )

  const trendPoints = useMemo(
    () =>
      buildHistoryTrendPoints(
        filterHistoryActivities(activities, period, advancedFilters, null, new Date(), customDateRange),
      ),
    [activities, advancedFilters, customDateRange, period],
  )

  const highlights = useMemo(
    () =>
      computeHistoryHighlights(
        filterHistoryActivities(activities, period, advancedFilters, null, new Date(), customDateRange),
      ),
    [activities, advancedFilters, customDateRange, period],
  )

  const heatmapCells = useMemo(() => buildHistoryHeatmap(activities), [activities])
  const heatmapLabel = new Date().toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const activeFiltersCount = countRunWalkHistoryActiveFilters(
    period,
    sort,
    advancedFilters,
    customDateRange,
  )

  async function handleRefresh() {
    setIsRefreshing(true)
    await loadHistory()
    setIsRefreshing(false)
  }

  async function handleCreateReport() {
    if (exportingReport) return

    if (period === 'custom' && !customDateRange) {
      Alert.alert('Período incompleto', 'Selecione um intervalo personalizado nos filtros avançados.')
      return
    }

    setExportingReport(true)
    try {
      await shareRunWalkHistoryReportPdf({
        patientName: patientName ?? undefined,
        period,
        customRange: customDateRange,
        sort,
        filters: advancedFilters,
        summary,
        highlights,
        activities: sortedActivities,
        targetActiveMinutes,
        targetDistanceKm,
        targetMinutesPerDay,
        chartSectionTitle: getHistoryChartSectionTitle(period, customDateRange),
        chartDays,
        trendPoints,
        heatmapCells,
        heatmapLabel,
      })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (error) {
      Alert.alert(
        'Não foi possível gerar o relatório',
        error instanceof Error ? error.message : 'Tente novamente em instantes.',
      )
    } finally {
      setExportingReport(false)
    }
  }

  function openActivity(activity: RunWalkActivitySummary) {
    setSelectedActivity(activity)
    setActivityDrawerVisible(true)
  }

  function openActivityById(activityId: string) {
    const activity = activities.find((entry) => entry.id === activityId)
    if (activity) openActivity(activity)
  }

  function handleHighlightPress(highlight: RunWalkHistoryHighlight) {
    if (highlight.activityId) {
      openActivityById(highlight.activityId)
    }
  }

  function handleChartDaySelect(dateIso: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedDateIso((current) => (current === dateIso ? null : dateIso))
  }

  if (!isLoading && activities.length === 0) {
    return <RunWalkHistoryEmptyState onStartPress={onStartActivity} />
  }

  return (
    <>
      <View style={styles.root}>
        <RunWalkHistoryFiltersBar
          activeFiltersCount={activeFiltersCount}
          exportingReport={exportingReport}
          onFiltersPress={() => setFiltersDrawerVisible(true)}
          onReportPress={() => void handleCreateReport()}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
          onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={colors.primaryLight}
            />
          }
        >
          <RunWalkHistoryRevealSection
            active={isActive}
            scrollY={scrollY}
            viewportHeight={viewportHeight}
          >
            {(revealed) => {
              const animation = resolveRunWalkHistoryAnimation(isActive, revealed)

              return (
                <RunWalkHistorySummaryCard
                  summary={summary}
                  targetActiveMinutes={targetActiveMinutes}
                  targetDistanceKm={targetDistanceKm}
                  animate={animation.animate}
                  preserveFinal={animation.preserveFinal}
                />
              )
            }}
          </RunWalkHistoryRevealSection>

          <RunWalkHistoryRevealSection
            active={isActive}
            scrollY={scrollY}
            viewportHeight={viewportHeight}
          >
            {(revealed) => {
              const animation = resolveRunWalkHistoryAnimation(isActive, revealed)

              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {getHistoryChartSectionTitle(period, customDateRange)}
                  </Text>

                  <RunWalkWeeklyBarChart
                    days={chartDays}
                    width={chartWidth}
                    targetMinutesPerDay={targetMinutesPerDay}
                    selectedDateIso={selectedDateIso}
                    onSelectDay={handleChartDaySelect}
                    layoutMode="chronological"
                    scrollable
                    visibleBars={7}
                    showLegend
                    animate={animation.animate}
                    preserveFinal={animation.preserveFinal}
                  />
                </View>
              )
            }}
          </RunWalkHistoryRevealSection>

          <RunWalkHistoryRevealSection
            active={isActive}
            scrollY={scrollY}
            viewportHeight={viewportHeight}
          >
            {(revealed) => {
              const animation = resolveRunWalkHistoryAnimation(isActive, revealed)

              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Evolução da distância</Text>
                  <RunWalkHistoryTrendChart
                    points={trendPoints}
                    width={chartWidth}
                    animate={animation.animate}
                    preserveFinal={animation.preserveFinal}
                  />
                </View>
              )
            }}
          </RunWalkHistoryRevealSection>

          <RunWalkHistoryRevealSection
            active={isActive}
            scrollY={scrollY}
            viewportHeight={viewportHeight}
          >
            {(revealed) => {
              const animation = resolveRunWalkHistoryAnimation(isActive, revealed)

              return (
                <RunWalkHistoryHeatmap
                  cells={heatmapCells}
                  monthLabel={heatmapLabel}
                  animate={animation.animate}
                  preserveFinal={animation.preserveFinal}
                />
              )
            }}
          </RunWalkHistoryRevealSection>

          <RunWalkHistoryRevealSection
            active={isActive}
            scrollY={scrollY}
            viewportHeight={viewportHeight}
          >
            {(revealed) => {
              const animation = resolveRunWalkHistoryAnimation(isActive, revealed)

              return (
                <RunWalkHistoryHighlightsRow
                  highlights={highlights}
                  animate={animation.animate}
                  preserveFinal={animation.preserveFinal}
                  onPress={handleHighlightPress}
                  onHorizontalScrollActive={onSegmentPagerLockChange}
                />
              )
            }}
          </RunWalkHistoryRevealSection>

          <RunWalkHistoryRevealSection
            active={isActive}
            scrollY={scrollY}
            viewportHeight={viewportHeight}
          >
            {(revealed) => {
              const animation = resolveRunWalkHistoryAnimation(isActive, revealed)

              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Seus treinos</Text>
                  <RunWalkHistoryFeed
                    activities={sortedActivities}
                    targetMinutesPerDay={targetMinutesPerDay}
                    animate={animation.animate}
                    preserveFinal={animation.preserveFinal}
                    onActivityPress={openActivity}
                    onActivityMapPress={openActivity}
                  />
                </View>
              )
            }}
          </RunWalkHistoryRevealSection>
        </ScrollView>
      </View>

      <RunWalkHistoryActivityDrawer
        visible={activityDrawerVisible}
        activity={selectedActivity}
        allActivities={activities}
        profilePhotoUri={profilePhotoUri}
        onClose={() => setActivityDrawerVisible(false)}
        onShare={() => setShareDrawerVisible(true)}
      />

      <RunWalkHistoryShareDrawer
        visible={shareDrawerVisible}
        activity={selectedActivity}
        onClose={() => setShareDrawerVisible(false)}
      />

      <RunWalkHistoryFiltersDrawer
        visible={filtersDrawerVisible}
        period={period}
        sort={sort}
        filters={advancedFilters}
        customRange={customDateRange}
        activityDateKeys={activityDateKeys}
        onClose={() => setFiltersDrawerVisible(false)}
        onApply={({ period: nextPeriod, sort: nextSort, advanced, customRange }) => {
          setPeriod(nextPeriod)
          setSort(nextSort)
          setAdvancedFilters(advanced)
          setCustomDateRange(customRange)
          setSelectedDateIso(null)
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 14,
    paddingTop: 4,
  },
  section: {
    gap: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
})
