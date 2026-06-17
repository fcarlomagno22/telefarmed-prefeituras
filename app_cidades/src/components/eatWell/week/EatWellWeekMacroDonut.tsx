import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import type { EatWellWeekSummary } from '../../../types/eatWell'
import type { NutritionGoals } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { formatGrams } from '../../../utils/eatWellNutritionStats'
import { formatMacroPercent } from '../../../utils/eatWellWeekStats'
import { RunWalkHistoryAnimatedBar } from '../../runWalk/history/RunWalkHistoryAnimatedBar'

type EatWellWeekMacroDonutProps = {
  summary: EatWellWeekSummary
  goals: NutritionGoals
  animate?: boolean
}

const SIZE = 120
const CX = SIZE / 2
const CY = SIZE / 2
const R = 46
const INNER_R = 30

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + radius * Math.cos(angleRad), y: cy + radius * Math.sin(angleRad) }
}

function describeDonutSegment(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  if (endAngle - startAngle >= 360) endAngle = startAngle + 359.999
  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle)
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle)
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle)
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ')
}

const MACRO_COLORS = {
  protein: '#60a5fa',
  carbs: '#fbbf24',
  fat: '#f472b6',
} as const

export function EatWellWeekMacroDonut({
  summary,
  goals,
  animate = true,
}: EatWellWeekMacroDonutProps) {
  const { proteinG, carbsG, fatG, fiberG, sugarsG, saturatedFatG } = summary.macroTotals
  const macroCalories = proteinG * 4 + carbsG * 4 + fatG * 9
  const segments = [
    { key: 'protein', grams: proteinG, color: MACRO_COLORS.protein },
    { key: 'carbs', grams: carbsG, color: MACRO_COLORS.carbs },
    { key: 'fat', grams: fatG, color: MACRO_COLORS.fat },
  ]

  let cursor = 0
  const paths = segments.map((segment) => {
    const pct = macroCalories > 0 ? (segment.grams * (segment.key === 'fat' ? 9 : 4)) / macroCalories : 0
    const sweep = pct * 360
    const startAngle = cursor
    const endAngle = cursor + sweep
    cursor = endAngle
    return {
      ...segment,
      pct: formatMacroPercent(segment.grams * (segment.key === 'fat' ? 9 : 4), macroCalories),
      path: describeDonutSegment(CX, CY, R, INNER_R, startAngle, endAngle),
    }
  })

  const activeDays = Math.max(summary.dayStats.filter((day) => !day.isFuture && day.hasData).length, 1)

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(96, 165, 250, 0.1)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.title}>Macros da semana</Text>

        <View style={styles.contentRow}>
          <View style={styles.donutWrap}>
            <Svg width={SIZE} height={SIZE}>
              {macroCalories <= 0 ? (
                <Path
                  d={describeDonutSegment(CX, CY, R, INNER_R, 0, 360)}
                  fill="rgba(255,255,255,0.06)"
                />
              ) : (
                paths.map((segment) => (
                  <Path key={segment.key} d={segment.path} fill={segment.color} />
                ))
              )}
            </Svg>
            <View style={styles.donutCenter} pointerEvents="none">
              <Text style={styles.donutLabel}>P / C / G</Text>
            </View>
          </View>

          <View style={styles.legendCol}>
            {paths.map((segment) => (
              <View key={segment.key} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
                <Text style={styles.legendLabel}>
                  {segment.key === 'protein' ? 'Proteína' : segment.key === 'carbs' ? 'Carbo' : 'Gordura'}
                </Text>
                <Text style={styles.legendValue}>{segment.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.barsBlock}>
          <SecondaryBar
            label="Fibras (média/dia)"
            consumed={summary.macroAverages.fiberG}
            target={goals.fiberG}
            color="#34d399"
            animate={animate}
          />
          <SecondaryBar
            label="Açúcares (média/dia)"
            consumed={summary.macroAverages.sugarsG}
            target={goals.sugarsMaxG}
            color="#fb923c"
            animate={animate}
            inverse
          />
          <SecondaryBar
            label="Gord. saturada (média/dia)"
            consumed={summary.macroAverages.saturatedFatG}
            target={goals.saturatedFatMaxG}
            color="#f87171"
            animate={animate}
            inverse
          />
        </View>

        <Text style={styles.footerMeta}>
          Total semanal · P {formatGrams(proteinG)} · C {formatGrams(carbsG)} · G {formatGrams(fatG)} · Fib{' '}
          {formatGrams(fiberG)} em {activeDays} dias
        </Text>
      </LinearGradient>
    </View>
  )
}

function SecondaryBar({
  label,
  consumed,
  target,
  color,
  animate,
  inverse = false,
}: {
  label: string
  consumed: number
  target: number
  color: string
  animate: boolean
  inverse?: boolean
}) {
  const progress = target > 0 ? consumed / target : 0

  return (
    <View style={styles.barRow}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>
          {Math.round(consumed)}/{Math.round(target)}g
        </Text>
      </View>
      <RunWalkHistoryAnimatedBar
        progress={Math.min(progress, inverse ? 1.2 : 1)}
        animate={animate}
        color={color}
        trackStyle={styles.barTrack}
      />
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
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.16)',
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  donutWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  legendCol: {
    flex: 1,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  legendValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  barsBlock: {
    gap: 10,
  },
  barRow: {
    gap: 5,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  barValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
  },
  footerMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
})
