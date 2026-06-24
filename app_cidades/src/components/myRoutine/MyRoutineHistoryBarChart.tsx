import { View, StyleSheet } from 'react-native'
import type { MyRoutineWeeklyHistoryPoint } from '../../utils/myRoutineHistoryStats'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import type { ThemeColors } from '../../theme/palettes'

const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'
const BAR_MAX_HEIGHT = 72

type MyRoutineHistoryBarChartProps = {
  series: MyRoutineWeeklyHistoryPoint[]
  onSelectWeek?: (point: MyRoutineWeeklyHistoryPoint) => void
  selectedWeekStartIso?: string | null
}

export function MyRoutineHistoryBarChart({
  series,
  onSelectWeek,
  selectedWeekStartIso,
}: MyRoutineHistoryBarChartProps) {
  const styles = useThemedStyles(createStyles)
  const maxAdherence = Math.max(100, ...series.map((point) => point.adherencePercent))

  return (
    <View style={styles.root}>
      <View style={styles.barsRow}>
        {series.map((point) => {
          const height = Math.max(6, Math.round((point.adherencePercent / maxAdherence) * BAR_MAX_HEIGHT))
          const selected = selectedWeekStartIso === point.weekStartIso
          const empty = point.trackedDays === 0

          return (
            <View key={point.weekStartIso} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height },
                    empty && styles.barEmpty,
                    selected && styles.barSelected,
                  ]}
                />
              </View>
              <View
                style={styles.barLabelWrap}
                accessibilityRole={onSelectWeek ? 'button' : undefined}
                accessibilityLabel={`${point.weekLabel}, ${point.adherencePercent}% aderência`}
                onTouchEnd={
                  onSelectWeek
                    ? () => {
                        onSelectWeek(point)
                      }
                    : undefined
                }
              >
                <View style={[styles.dot, selected && styles.dotSelected]} />
              </View>
            </View>
          )
        })}
      </View>
      <View style={styles.labelsRow}>
        {series.map((point) => (
          <View key={`${point.weekStartIso}-label`} style={styles.labelCol}>
            <View style={styles.weekLabelLine} />
          </View>
        ))}
      </View>
    </View>
  )
}

export function MyRoutineHistoryBarLegend({
  series,
}: {
  series: MyRoutineWeeklyHistoryPoint[]
}) {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.legendRow}>
      {series.map((point) => (
        <View key={point.weekStartIso} style={styles.legendItem}>
          <View style={[styles.legendSwatch, { opacity: point.trackedDays === 0 ? 0.35 : 1 }]} />
          <View style={styles.legendCopy}>
            <View style={styles.legendWeek}>{point.weekLabel.split('–')[0]?.trim() ?? point.weekLabel}</View>
            <View style={styles.legendValue}>
              {point.trackedDays === 0 ? '—' : `${point.adherencePercent}%`}
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  root: {
    gap: 8,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barTrack: {
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: ACCENT,
    minHeight: 6,
  },
  barEmpty: {
    backgroundColor: colors.glassBorder,
  },
  barSelected: {
    backgroundColor: ACCENT_LIGHT,
  },
  barLabelWrap: {
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotSelected: {
    backgroundColor: ACCENT_LIGHT,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 4,
  },
  labelCol: {
    flex: 1,
  },
  weekLabelLine: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '44%',
    flexGrow: 1,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  legendCopy: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  legendWeek: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  legendValue: {
    color: '#f0abfc',
    fontSize: 11,
    fontWeight: '800',
  },
}
}

