import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg'
import type { MealSlot, MealSlotContribution } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import { MEAL_SLOT_CONFIG, MEAL_SLOT_ORDER } from '../../utils/eatWellMealSlots'
import { formatCalories } from '../../utils/eatWellNutritionStats'

type EatWellMealContributionDonutProps = {
  contributions: MealSlotContribution[]
  totalCalories: number
  selectedSlot: MealSlot | null
  onSelectSlot: (slot: MealSlot | null) => void
  animate?: boolean
  idleProgress?: boolean
}

const SIZE = 168
const STROKE = 22
const CX = SIZE / 2
const CY = SIZE / 2
const R = (SIZE - STROKE) / 2
const INNER_R = R - STROKE
const EMPTY_SLICE_DEGREES = 360 / MEAL_SLOT_ORDER.length

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  }
}

function describeDonutSegment(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  if (endAngle - startAngle >= 360) {
    endAngle = startAngle + 359.999
  }

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

function buildDonutSegments(contributions: MealSlotContribution[], totalCalories: number) {
  const contributionMap = new Map(contributions.map((item) => [item.slot, item]))
  const ordered = MEAL_SLOT_ORDER.map(
    (slot) =>
      contributionMap.get(slot) ?? {
        slot,
        calories: 0,
        percentage: 0,
      },
  )

  if (totalCalories <= 0) {
    let cursor = 0
    return ordered.map((item) => {
      const startAngle = cursor
      const endAngle = cursor + EMPTY_SLICE_DEGREES
      cursor = endAngle
      return {
        ...item,
        startAngle,
        endAngle,
        path: describeDonutSegment(CX, CY, R, INNER_R, startAngle, endAngle),
        isEmpty: true,
      }
    })
  }

  const visualWeights = ordered.map((item) => (item.calories > 0 ? item.calories : 1))
  const visualTotal = visualWeights.reduce((sum, value) => sum + value, 0)
  let cursor = 0

  return ordered.map((item, index) => {
    const sweep = (visualWeights[index]! / visualTotal) * 360
    const startAngle = cursor
    const endAngle = cursor + sweep
    cursor = endAngle

    return {
      ...item,
      startAngle,
      endAngle,
      path: describeDonutSegment(CX, CY, R, INNER_R, startAngle, endAngle),
      isEmpty: item.calories <= 0,
    }
  })
}

function segmentGradientVector(startAngle: number, endAngle: number) {
  const midAngle = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180)
  return {
    x1: CX - Math.cos(midAngle) * R,
    y1: CY - Math.sin(midAngle) * R,
    x2: CX + Math.cos(midAngle) * R,
    y2: CY + Math.sin(midAngle) * R,
  }
}

export function EatWellMealContributionDonut({
  contributions,
  totalCalories,
  selectedSlot,
  onSelectSlot,
  animate = true,
  idleProgress = true,
}: EatWellMealContributionDonutProps) {
  const showProgress = animate || idleProgress
  const revealProgress = useRef(new Animated.Value(showProgress ? 1 : 0)).current
  const segments = useMemo(
    () => buildDonutSegments(contributions, totalCalories),
    [contributions, totalCalories],
  )

  const selectedContribution = selectedSlot
    ? contributions.find((item) => item.slot === selectedSlot)
    : null

  const centerLabel = selectedSlot ? MEAL_SLOT_CONFIG[selectedSlot].shortLabel : 'Total'
  const centerValue = selectedContribution
    ? formatCalories(selectedContribution.calories)
    : formatCalories(totalCalories)
  const centerPct = selectedContribution
    ? `${selectedContribution.percentage}%`
    : totalCalories > 0
      ? '100%'
      : '—'

  useEffect(() => {
    if (!animate) {
      revealProgress.setValue(showProgress ? 1 : 0)
      return
    }

    revealProgress.setValue(0)
    Animated.timing(revealProgress, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [animate, contributions, revealProgress, showProgress, totalCalories])

  const chartScale = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1],
  })

  function handleSegmentPress(slot: MealSlot) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelectSlot(selectedSlot === slot ? null : slot)
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.12)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Contribuição por refeição</Text>
          {selectedSlot ? (
            <Pressable onPress={() => onSelectSlot(null)} style={styles.clearFilter}>
              <Text style={styles.clearFilterText}>Ver tudo</Text>
            </Pressable>
          ) : null}
        </View>

        <Animated.View
          style={[
            styles.donutSection,
            {
              opacity: revealProgress,
              transform: [{ scale: chartScale }],
            },
          ]}
        >
          <View style={styles.donutWrap}>
            <Svg width={SIZE} height={SIZE}>
              <Defs>
                {segments.map((segment) => {
                  const slotConfig = MEAL_SLOT_CONFIG[segment.slot]
                  const vector = segmentGradientVector(segment.startAngle, segment.endAngle)

                  if (segment.isEmpty) {
                    return (
                      <SvgLinearGradient
                        key={`grad-${segment.slot}`}
                        id={`eat-well-donut-${segment.slot}`}
                        x1={CX}
                        y1={CY - R}
                        x2={CX}
                        y2={CY + R}
                        gradientUnits="userSpaceOnUse"
                      >
                        <Stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
                        <Stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
                      </SvgLinearGradient>
                    )
                  }

                  return (
                    <SvgLinearGradient
                      key={`grad-${segment.slot}`}
                      id={`eat-well-donut-${segment.slot}`}
                      x1={vector.x1}
                      y1={vector.y1}
                      x2={vector.x2}
                      y2={vector.y2}
                      gradientUnits="userSpaceOnUse"
                    >
                      <Stop offset="0%" stopColor={slotConfig.color} />
                      <Stop offset="100%" stopColor={slotConfig.donutColor} />
                    </SvgLinearGradient>
                  )
                })}
              </Defs>

              {segments.map((segment) => {
                const active = !selectedSlot || selectedSlot === segment.slot

                return (
                  <Path
                    key={segment.slot}
                    d={segment.path}
                    fill={`url(#eat-well-donut-${segment.slot})`}
                    opacity={active ? 1 : 0.22}
                    onPress={() => handleSegmentPress(segment.slot)}
                  />
                )
              })}
            </Svg>
            <View style={styles.donutCenter} pointerEvents="none">
              <Text style={styles.centerPct}>{centerPct}</Text>
              <Text style={styles.centerValue}>{centerValue}</Text>
              <Text style={styles.centerLabel}>{centerLabel}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: revealProgress }}>
          <View style={styles.legendGrid}>
          {MEAL_SLOT_ORDER.map((slot) => {
            const item = contributions.find((entry) => entry.slot === slot) ?? {
              slot,
              calories: 0,
              percentage: 0,
            }
            const active = selectedSlot === slot

            return (
              <Pressable
                key={slot}
                onPress={() => handleSegmentPress(slot)}
                style={({ pressed }) => [
                  styles.legendItem,
                  active && styles.legendItemActive,
                  pressed && styles.legendItemPressed,
                ]}
              >
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: MEAL_SLOT_CONFIG[slot].donutColor,
                      opacity: item.calories > 0 ? 1 : 0.35,
                    },
                  ]}
                />
                <View style={styles.legendTextCol}>
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {MEAL_SLOT_CONFIG[slot].label}
                  </Text>
                  <Text style={styles.legendMeta}>
                    {item.percentage}% · {formatCalories(item.calories)}
                  </Text>
                </View>
              </Pressable>
            )
          })}
          </View>
        </Animated.View>

        <Text style={styles.insight}>
          {totalCalories > 0
            ? 'Toque em uma fatia para filtrar a linha do tempo do dia.'
            : 'Todos os horários de refeição aparecem aqui — registre para ver a distribuição.'}
        </Text>
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
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.18)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  clearFilter: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(132, 204, 22, 0.14)',
  },
  clearFilterText: {
    color: '#a3e635',
    fontSize: 11,
    fontWeight: '700',
  },
  chartRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  donutSection: {
    alignItems: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    gap: 1,
    paddingHorizontal: 24,
  },
  centerPct: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '800',
  },
  centerValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
    flexGrow: 1,
    minWidth: '47%',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  legendItemActive: {
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.28)',
  },
  legendItemPressed: {
    opacity: 0.88,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendTextCol: {
    flex: 1,
    gap: 1,
  },
  legendLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  legendMeta: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  insight: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
})
