import { RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import type { EatWellWeekSummary, NutritionGoals } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { EatWellWeekBalanceRing } from './EatWellWeekBalanceRing'
import { EatWellWeekComboChart } from './EatWellWeekComboChart'
import { EatWellWeekHero } from './EatWellWeekHero'
import { EatWellWeekHighlightsCarousel } from './EatWellWeekHighlightsCarousel'
import { EatWellWeekMacroDonut } from './EatWellWeekMacroDonut'
import { EatWellWeekMealsFeed } from './EatWellWeekMealsFeed'
import { EatWellWeekRunWalkCard } from './EatWellWeekRunWalkCard'
import { EatWellWeekScoreHeatmap } from './EatWellWeekScoreHeatmap'

type EatWellWeekTabProps = {
  summary: EatWellWeekSummary | null
  goals: NutritionGoals
  bottomPadding: number
  isActive?: boolean
  isRefreshing?: boolean
  onRefresh?: () => void
  onSelectDay?: (dateIso: string) => void
  onNavigateRunWalk?: () => void
  onHorizontalScrollActive?: (active: boolean) => void
}

export function EatWellWeekTab({
  summary,
  goals,
  bottomPadding,
  isActive = true,
  isRefreshing = false,
  onRefresh,
  onSelectDay,
  onNavigateRunWalk,
  onHorizontalScrollActive,
}: EatWellWeekTabProps) {
  const { width } = useWindowDimensions()

  if (!summary) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Carregando resumo da semana...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryLight}
          />
        ) : undefined
      }
    >
      <EatWellWeekHero summary={summary} animate={isActive} />
      <EatWellWeekBalanceRing summary={summary} animate={isActive} />
      <EatWellWeekComboChart summary={summary} width={width} animate={isActive} />
      <EatWellWeekMacroDonut summary={summary} goals={goals} animate={isActive} />
      <EatWellWeekScoreHeatmap
        summary={summary}
        onSelectDay={onSelectDay}
      />
      <EatWellWeekRunWalkCard summary={summary} onPress={onNavigateRunWalk} />
      <EatWellWeekHighlightsCarousel
        highlights={summary.highlights}
        onPressHighlight={(highlight) => onSelectDay?.(highlight.dateIso)}
        onHorizontalScrollActive={onHorizontalScrollActive}
      />
      <EatWellWeekMealsFeed meals={summary.meals} />
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
})
