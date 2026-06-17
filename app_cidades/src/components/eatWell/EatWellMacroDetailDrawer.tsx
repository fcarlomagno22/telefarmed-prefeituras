import { StyleSheet, Text, View } from 'react-native'
import type { DailyNutritionTotals, MacroChipId, MealLog, NutritionGoals } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import { formatCalories, formatGrams, sumMealMacros } from '../../utils/eatWellNutritionStats'
import { getMealSlotConfig } from '../../utils/eatWellMealSlots'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

const MACRO_COPY: Record<
  MacroChipId,
  { title: string; description: string; examples: string }
> = {
  fiber: {
    title: 'Fibras',
    description: 'Importantes para saciedade, intestino e controle glicêmico.',
    examples: 'Verduras, legumes, frutas, feijão e cereais integrais.',
  },
  sugars: {
    title: 'Açúcares totais',
    description: 'Acompanhe especialmente sobremesas, bebidas e industrializados.',
    examples: 'Refrigerantes, sucos, doces, bolos e iogurtes açucarados.',
  },
  saturated_fat: {
    title: 'Gordura saturada',
    description: 'Indicador relevante para saúde cardiovascular quando elevado.',
    examples: 'Queijos gordurosos, carnes processadas, manteiga e frituras.',
  },
  protein: {
    title: 'Proteínas',
    description: 'Essenciais para saciedade, músculos e recuperação.',
    examples: 'Carnes, ovos, peixes, leite, queijo e feijão.',
  },
  carbs: {
    title: 'Carboidratos',
    description: 'Principal fonte de energia do dia.',
    examples: 'Arroz, massas, pães, batata, mandioca e frutas.',
  },
  fat: {
    title: 'Gorduras',
    description: 'Importantes para hormônios e absorção de vitaminas.',
    examples: 'Óleo, azeite, manteiga, queijos, carnes e castanhas.',
  },
}

type EatWellMacroDetailDrawerProps = {
  visible: boolean
  macroId: MacroChipId | null
  totals: DailyNutritionTotals
  goals: NutritionGoals
  meals: MealLog[]
  onClose: () => void
}

export function EatWellMacroDetailDrawer({
  visible,
  macroId,
  totals,
  goals,
  meals,
  onClose,
}: EatWellMacroDetailDrawerProps) {
  if (!macroId) return null

  const copy = MACRO_COPY[macroId]

  const consumed =
    macroId === 'fiber'
      ? totals.fiberG
      : macroId === 'sugars'
        ? totals.sugarsG
        : macroId === 'saturated_fat'
          ? totals.saturatedFatG
          : macroId === 'protein'
            ? totals.proteinG
            : macroId === 'carbs'
              ? totals.carbsG
              : totals.fatG

  const target =
    macroId === 'fiber'
      ? goals.fiberG
      : macroId === 'sugars'
        ? goals.sugarsMaxG
        : macroId === 'saturated_fat'
          ? goals.saturatedFatMaxG
          : macroId === 'protein'
            ? goals.proteinG
            : macroId === 'carbs'
              ? goals.carbsG
              : goals.fatG

  const contributors = meals
    .map((meal) => ({
      meal,
      calories: sumMealMacros(meal).calories,
      value:
        macroId === 'fiber'
          ? sumMealMacros(meal).fiberG
          : macroId === 'sugars'
            ? sumMealMacros(meal).sugarsG
            : macroId === 'saturated_fat'
              ? sumMealMacros(meal).saturatedFatG
              : macroId === 'protein'
                ? sumMealMacros(meal).proteinG
                : macroId === 'carbs'
                  ? sumMealMacros(meal).carbsG
                  : sumMealMacros(meal).fatG,
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={copy.title}
      subtitle={`${formatGrams(consumed)} · meta ${formatGrams(target)}`}
      onClose={onClose}
    >
      <Text style={styles.description}>{copy.description}</Text>
      <Text style={styles.examples}>{copy.examples}</Text>

      <Text style={styles.sectionTitle}>Contribuição por refeição</Text>
      {contributors.length === 0 ? (
        <Text style={styles.empty}>Nenhuma refeição registrada ainda.</Text>
      ) : (
        contributors.map(({ meal, value, calories }) => (
          <View key={meal.id} style={styles.contribRow}>
            <View style={styles.contribTextCol}>
              <Text style={styles.contribTitle}>{getMealSlotConfig(meal.slot).label}</Text>
              <Text style={styles.contribMeta}>{formatCalories(calories)}</Text>
            </View>
            <Text style={styles.contribValue}>{formatGrams(value)}</Text>
          </View>
        ))
      )}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  description: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  examples: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  empty: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  contribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  contribTextCol: {
    gap: 2,
  },
  contribTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  contribMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  contribValue: {
    color: '#a3e635',
    fontSize: 13,
    fontWeight: '800',
  },
})
