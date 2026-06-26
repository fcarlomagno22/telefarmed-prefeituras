import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type {
  BalanceScoreBreakdown,
  DailyNutritionTotals,
  MacroChipId,
  NutritionGoals,
} from '../../types/eatWell'
import { colors } from '../../theme/colors'
import {
  formatCalories,
  formatGrams,
  formatLitersFromMl,
  formatMacroProgress,
  getBalanceTier,
} from '../../utils/eatWellNutritionStats'
import { RunWalkHistoryAnimatedBar } from '../runWalk/history/RunWalkHistoryAnimatedBar'
import { RunWalkProgressRing } from '../runWalk/RunWalkProgressRing'

type EatWellBalanceHeroProps = {
  totals: DailyNutritionTotals
  goals: NutritionGoals
  adjustedCalorieTarget: number
  balance: BalanceScoreBreakdown
  animate?: boolean
  idleProgress?: boolean
  onBalancePress: () => void
  onMacroChipPress: (macroId: MacroChipId) => void
}

function MacroChip({
  label,
  value,
  statusColor,
  onPress,
}: {
  label: string
  value: string
  statusColor: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
      accessibilityRole="button"
    >
      <View style={[styles.chipDot, { backgroundColor: statusColor }]} />
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </Pressable>
  )
}

function MacroBarRow({
  label,
  consumed,
  target,
  color,
  animate,
  idleProgress,
}: {
  label: string
  consumed: number
  target: number
  color: string
  animate: boolean
  idleProgress: boolean
}) {
  const progress = target > 0 ? consumed / target : 0

  return (
    <View style={styles.macroBarRow}>
      <View style={styles.macroBarHeader}>
        <Text style={styles.macroBarLabel}>{label}</Text>
        <Text style={styles.macroBarValue}>{formatMacroProgress(consumed, target)}</Text>
      </View>
      <RunWalkHistoryAnimatedBar
        progress={Math.min(progress, 1)}
        animate={animate}
        preserveFinal={animate || idleProgress}
        color={color}
        trackStyle={styles.macroBarTrack}
      />
    </View>
  )
}

function chipStatusColor(consumed: number, target: number, inverse = false) {
  const ratio = target > 0 ? consumed / target : 0
  if (inverse) {
    if (ratio <= 0.7) return '#6ee7b7'
    if (ratio <= 1) return '#fbbf24'
    return '#f87171'
  }
  if (ratio >= 0.85) return '#6ee7b7'
  if (ratio >= 0.55) return '#fbbf24'
  return '#93c5fd'
}

export function EatWellBalanceHero({
  totals,
  goals,
  adjustedCalorieTarget,
  balance,
  animate = true,
  idleProgress = true,
  onBalancePress,
  onMacroChipPress,
}: EatWellBalanceHeroProps) {
  const showProgress = animate || idleProgress
  const tier = getBalanceTier(balance.score)
  const calorieProgress =
    adjustedCalorieTarget > 0 ? totals.calories / adjustedCalorieTarget : 0
  const RING_SIZE = 118
  const RING_STROKE = 7

  const chips: Array<{ id: MacroChipId; label: string; value: string; color: string }> = [
    {
      id: 'fiber',
      label: 'Fibras',
      value: formatGrams(totals.fiberG),
      color: chipStatusColor(totals.fiberG, goals.fiberG),
    },
    {
      id: 'sugars',
      label: 'Açúcares',
      value: formatGrams(totals.sugarsG),
      color: chipStatusColor(totals.sugarsG, goals.sugarsMaxG, true),
    },
    {
      id: 'saturated_fat',
      label: 'Gord. Sat.',
      value: formatGrams(totals.saturatedFatG),
      color: chipStatusColor(totals.saturatedFatG, goals.saturatedFatMaxG, true),
    },
  ]

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(132, 204, 22, 0.22)', 'rgba(77, 124, 15, 0.12)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={onBalancePress}
            style={({ pressed }) => [styles.ringCol, pressed && styles.balanceColPressed]}
            accessibilityRole="button"
            accessibilityLabel="Ver detalhes do score de equilíbrio"
          >
            <Text style={styles.balanceTitle}>Score de equilíbrio</Text>
            <RunWalkProgressRing
              progress={balance.score / 100}
              value={String(balance.score)}
              countTo={balance.score}
              formatCount={(value) => String(Math.round(value))}
              label="de 100"
              size={RING_SIZE}
              stroke={RING_STROKE}
              gradientId="eat-well-balance-ring"
              gradientColors={tier.gradientColors}
              animate={animate}
              preserveFinal={showProgress}
            />
            <View style={[styles.tierBadge, { borderColor: `${tier.gradientColors[1]}66` }]}>
              <Text style={[styles.tierBadgeText, { color: tier.gradientColors[0] }]}>
                {tier.label}
              </Text>
            </View>
            <Text style={styles.balanceHint}>Toque para entender</Text>
          </Pressable>

          <View style={styles.ringCol}>
            <Text style={styles.balanceTitle}>Calorias</Text>
            <RunWalkProgressRing
              progress={Math.min(calorieProgress, 1)}
              value={formatCalories(totals.calories)}
              countTo={totals.calories}
              formatCount={formatCalories}
              label="consumidas"
              size={RING_SIZE}
              stroke={RING_STROKE}
              gradientId="eat-well-calorie-ring"
              gradientColors={['#fde68a', '#f59e0b', '#d97706']}
              animate={animate}
              preserveFinal={showProgress}
            />
            <View style={styles.waterMini}>
              <Ionicons name="water" size={14} color="#67e8f9" />
              <Text style={styles.waterMiniText}>
                {formatLitersFromMl(totals.waterMl)} / {formatLitersFromMl(goals.waterMl)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.macroBars}>
          <MacroBarRow
            label="Proteínas"
            consumed={totals.proteinG}
            target={goals.proteinG}
            color="#60a5fa"
            animate={animate}
            idleProgress={idleProgress}
          />
          <MacroBarRow
            label="Carboidratos"
            consumed={totals.carbsG}
            target={goals.carbsG}
            color="#fbbf24"
            animate={animate}
            idleProgress={idleProgress}
          />
          <MacroBarRow
            label="Gorduras"
            consumed={totals.fatG}
            target={goals.fatG}
            color="#f472b6"
            animate={animate}
            idleProgress={idleProgress}
          />
        </View>

        <View style={styles.chipsRow}>
          {chips.map((chip) => (
            <MacroChip
              key={chip.id}
              label={chip.label}
              value={chip.value}
              statusColor={chip.color}
              onPress={() => onMacroChipPress(chip.id)}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.22)',
  },
  topRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  ringCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  balanceCol: {
    alignItems: 'center',
    gap: 6,
  },
  balanceColPressed: {
    opacity: 0.92,
  },
  balanceTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  balanceHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  waterMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(103, 232, 249, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(103, 232, 249, 0.22)',
  },
  waterMiniText: {
    color: '#a5f3fc',
    fontSize: 11,
    fontWeight: '700',
  },
  macroBars: {
    gap: 10,
  },
  macroBarRow: {
    gap: 5,
  },
  macroBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroBarLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  macroBarValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  macroBarTrack: {
    height: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 64,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  chipLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  chipValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
})
