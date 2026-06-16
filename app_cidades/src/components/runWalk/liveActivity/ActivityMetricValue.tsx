import { StyleSheet, Text, type TextStyle } from 'react-native'
import type { ActivityMetricParts } from '../../../utils/runWalkActivityStats'
import { colors } from '../../../theme/colors'

type ActivityMetricValueProps = {
  parts: ActivityMetricParts
  valueStyle?: TextStyle
  unitStyle?: TextStyle
}

export function ActivityMetricValue({
  parts,
  valueStyle,
  unitStyle,
}: ActivityMetricValueProps) {
  return (
    <Text style={[styles.value, valueStyle]} numberOfLines={1}>
      {parts.value}
      {parts.unit ? <Text style={[styles.unit, unitStyle]}> {parts.unit}</Text> : null}
    </Text>
  )
}

const styles = StyleSheet.create({
  value: {
    color: colors.text,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    color: colors.textMuted,
    fontWeight: '700',
  },
})
