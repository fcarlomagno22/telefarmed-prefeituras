import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { EatWellMenuDayLog, EatWellMenuFoodStatus, EatWellMenuMeal } from '../../../types/eatWell'
import type { MealSlot } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import {
  computeMealConsumedMacros,
  getMenuDetailSuggestedTime,
  getMenuEntryStatus,
} from '../../../utils/eatWellMenuDetail'
import { formatCalories, formatGrams } from '../../../utils/eatWellNutritionStats'
import { getMealSlotConfig } from '../../../utils/eatWellMealSlots'
import { RunWalkHistoryAnimatedNumber } from '../../runWalk/history/RunWalkHistoryAnimatedNumber'
import { RunWalkSheetDrawer } from '../../runWalk/RunWalkSheetDrawer'

type EatWellMenuMealDrawerProps = {
  visible: boolean
  slot: MealSlot | null
  meal: EatWellMenuMeal | null
  dayLog: EatWellMenuDayLog | null
  menuTargetCalories: number
  onClose: () => void
  onToggleEntryStatus: (
    slot: MealSlot,
    entryId: string,
    status: EatWellMenuFoodStatus | null,
  ) => void
  onSubstitutePress: () => void
}

function MacroStat({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number
  unit: string
  color: string
}) {
  return (
    <View style={styles.macroStat}>
      <Text style={styles.macroLabel}>{label}</Text>
      <RunWalkHistoryAnimatedNumber
        value={value}
        animate
        preserveFinal={false}
        duration={650}
        formatter={(next) => `${Math.round(next)}${unit}`}
        style={[styles.macroValue, { color }]}
      />
    </View>
  )
}

export function EatWellMenuMealDrawer({
  visible,
  slot,
  meal,
  dayLog,
  menuTargetCalories,
  onClose,
  onToggleEntryStatus,
  onSubstitutePress,
}: EatWellMenuMealDrawerProps) {
  if (!slot) return null

  const config = getMealSlotConfig(slot)
  const suggestedTime = getMenuDetailSuggestedTime(slot)
  const entries = meal?.entries ?? []
  const consumedMacros = computeMealConsumedMacros(meal, dayLog, slot)

  function handleStatusPress(entryId: string, nextStatus: EatWellMenuFoodStatus) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const current = getMenuEntryStatus(dayLog, slot!, entryId)
    onToggleEntryStatus(slot!, entryId, current === nextStatus ? null : nextStatus)
  }

  const footer = (
    <View style={styles.footerStack}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onSubstitutePress()
        }}
        style={({ pressed }) => [styles.substituteBtn, pressed && styles.substituteBtnPressed]}
      >
        <Ionicons name="swap-horizontal-outline" size={16} color="#d9f99d" />
        <Text style={styles.substituteBtnText}>Substituir alimento</Text>
      </Pressable>

      <View style={styles.macroCard}>
        <Text style={styles.macroTitle}>Macronutrientes consumidos nesta refeição</Text>
        <View style={styles.macroGrid}>
          <MacroStat label="Calorias" value={consumedMacros.calories} unit=" kcal" color="#fde68a" />
          <MacroStat label="Proteína" value={consumedMacros.proteinG} unit="g" color="#60a5fa" />
          <MacroStat label="Carbo" value={consumedMacros.carbsG} unit="g" color="#fbbf24" />
          <MacroStat label="Gordura" value={consumedMacros.fatG} unit="g" color="#f472b6" />
        </View>
        <Text style={styles.macroMeta}>
          Fibra {formatGrams(consumedMacros.fiberG)} · Açúcares {formatGrams(consumedMacros.sugarsG)} ·
          Sat. {formatGrams(consumedMacros.saturatedFatG)}
        </Text>
        <Text style={styles.macroHint}>
          Marque o que você consumiu para atualizar os totais · meta do cardápio{' '}
          {formatCalories(menuTargetCalories)}
        </Text>
      </View>
    </View>
  )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={config.label}
      subtitle={`Sugestão · ${suggestedTime}`}
      onClose={onClose}
      fullScreen
      scrollable
      footer={footer}
    >
      {entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Nenhum alimento sugerido</Text>
          <Text style={styles.emptyText}>
            Esta refeição ainda não possui itens no seu cardápio.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => {
            const status = getMenuEntryStatus(dayLog, slot, entry.id)
            const consumed = status === 'consumed'
            const skipped = status === 'skipped'

            return (
              <View key={entry.id} style={styles.foodCard}>
                <View style={styles.foodTextCol}>
                  <Text style={styles.foodName}>{entry.name}</Text>
                  <Text style={styles.foodPortion}>{entry.portionLabel}</Text>
                  <Text style={styles.foodCalories}>{formatCalories(entry.macros.calories)}</Text>
                </View>

                <View style={styles.actionsCol}>
                  <Pressable
                    onPress={() => handleStatusPress(entry.id, 'consumed')}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      consumed && styles.actionBtnConsumed,
                      pressed && styles.actionBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Marcar ${entry.name} como consumido`}
                  >
                    <Ionicons
                      name={consumed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                      size={24}
                      color={consumed ? '#84cc16' : colors.textSubtle}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => handleStatusPress(entry.id, 'skipped')}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      skipped && styles.actionBtnSkipped,
                      pressed && styles.actionBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Marcar ${entry.name} como não consumido`}
                  >
                    <Ionicons
                      name={skipped ? 'close-circle' : 'close-circle-outline'}
                      size={24}
                      color={skipped ? '#f87171' : colors.textSubtle}
                    />
                  </Pressable>
                </View>
              </View>
            )
          })}
        </View>
      )}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  foodTextCol: {
    flex: 1,
    gap: 3,
  },
  foodName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  foodPortion: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  foodCalories: {
    color: '#a3e635',
    fontSize: 11,
    fontWeight: '700',
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  actionBtnConsumed: {
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
  },
  actionBtnSkipped: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  actionBtnPressed: {
    opacity: 0.82,
  },
  footerStack: {
    gap: 12,
  },
  substituteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.24)',
  },
  substituteBtnPressed: {
    opacity: 0.9,
  },
  substituteBtnText: {
    color: '#d9f99d',
    fontSize: 13,
    fontWeight: '800',
  },
  macroCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  macroTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  macroStat: {
    width: '47%',
    gap: 2,
  },
  macroLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  macroMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  macroHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
})
