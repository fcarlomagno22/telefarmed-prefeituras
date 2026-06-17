import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'
import type {
  RunWalkHistoryHeatmapCell,
  RunWalkHistoryHighlight,
  RunWalkHistoryPeriodSummary,
  RunWalkHistoryTrendPoint,
} from '../../../types/runWalkHistory'
import type { WeeklyCalendarDay } from '../../../types/runWalk'
import { RunWalkHistoryHeatmap } from './RunWalkHistoryHeatmap'
import { RunWalkHistoryHighlightsRow } from './RunWalkHistoryHighlightsRow'
import { RunWalkHistorySummaryCard } from './RunWalkHistorySummaryCard'
import { RunWalkHistoryTrendChart } from './RunWalkHistoryTrendChart'
import { RunWalkWeeklyBarChart } from '../RunWalkWeeklyBarChart'
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { colors } from '../../../theme/colors'

type RunWalkHistoryStatsDrawerProps = {
  visible: boolean
  onClose: () => void
  summary: RunWalkHistoryPeriodSummary
  chartDays: WeeklyCalendarDay[]
  trendPoints: RunWalkHistoryTrendPoint[]
  heatmapCells: RunWalkHistoryHeatmapCell[]
  heatmapLabel: string
  highlights: RunWalkHistoryHighlight[]
  targetActiveMinutes: number
  targetDistanceKm: number
  targetMinutesPerDay: number
  onHighlightPress?: (highlight: RunWalkHistoryHighlight) => void
}

export function RunWalkHistoryStatsDrawer({
  visible,
  onClose,
  summary,
  chartDays,
  trendPoints,
  heatmapCells,
  heatmapLabel,
  highlights,
  targetActiveMinutes,
  targetDistanceKm,
  targetMinutesPerDay,
  onHighlightPress,
}: RunWalkHistoryStatsDrawerProps) {
  const { width } = useWindowDimensions()
  const chartWidth = width - 40

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Estatísticas completas"
      subtitle="Visão expandida do seu histórico"
      onClose={onClose}
      scrollable
    >
      <View style={styles.summaryWrap}>
        <RunWalkHistorySummaryCard
          summary={summary}
          targetActiveMinutes={targetActiveMinutes}
          targetDistanceKm={targetDistanceKm}
          animate={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atividade por dia</Text>
        <RunWalkWeeklyBarChart
          days={chartDays}
          width={chartWidth}
          targetMinutesPerDay={targetMinutesPerDay}
          layoutMode="chronological"
          scrollable
          visibleBars={7}
          showLegend
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evolução da distância</Text>
        <RunWalkHistoryTrendChart
          points={trendPoints}
          width={chartWidth}
          animate={false}
        />
      </View>

      <View style={styles.heatmapWrap}>
        <RunWalkHistoryHeatmap
          cells={heatmapCells}
          monthLabel={heatmapLabel}
          animate={false}
        />
      </View>

      <RunWalkHistoryHighlightsRow
        highlights={highlights}
        animate={false}
        onPress={onHighlightPress}
      />
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  summaryWrap: {
    marginHorizontal: -4,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  heatmapWrap: {
    marginHorizontal: -4,
  },
})
