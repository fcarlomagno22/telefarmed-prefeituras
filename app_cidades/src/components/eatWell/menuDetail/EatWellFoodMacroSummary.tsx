import { StyleSheet, Text, View } from 'react-native'
import type { MacroNutrients } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { formatCalories, formatGrams } from '../../../utils/eatWellNutritionStats'

type EatWellFoodMacroSummaryProps = {
  macros: MacroNutrients
  compact?: boolean
}

export function EatWellFoodMacroSummary({ macros, compact = false }: EatWellFoodMacroSummaryProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.calories}>{formatCalories(macros.calories)}</Text>
      <Text style={styles.line}>
        Prot. {formatGrams(macros.proteinG)} · Carbo {formatGrams(macros.carbsG)} · Gord.{' '}
        {formatGrams(macros.fatG)}
      </Text>
      {!compact ? (
        <Text style={styles.lineMuted}>
          Fibra {formatGrams(macros.fiberG)} · Açúcares {formatGrams(macros.sugarsG)} · Sat.{' '}
          {formatGrams(macros.saturatedFatG)}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 3,
    paddingTop: 2,
  },
  wrapCompact: {
    gap: 2,
  },
  calories: {
    color: '#a3e635',
    fontSize: 11,
    fontWeight: '800',
  },
  line: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  lineMuted: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
})
