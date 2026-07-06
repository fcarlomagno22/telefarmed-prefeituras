import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { EatWellDailyRecord, MealLog, MealSlot } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import {
  formatCalories,
  getMealForSlot,
  sumMealMacros,
} from '../../utils/eatWellNutritionStats'
import {
  getMealSlotConfig,
  MEAL_SLOT_ORDER,
  formatMealTime,
} from '../../utils/eatWellMealSlots'

type EatWellMealTimelineProps = {
  record: EatWellDailyRecord
  filterSlot: MealSlot | null
  onAddMeal: (slot: MealSlot) => void
  onEditMeal: (meal: MealLog) => void
  onDeleteMeal: (mealId: string) => void
}

function TimelineItem({
  slot,
  meal,
  isLast,
  dimmed,
  onAdd,
  onEdit,
  onDelete,
}: {
  slot: MealSlot
  meal: MealLog | null
  isLast: boolean
  dimmed: boolean
  onAdd: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const config = getMealSlotConfig(slot)
  const macros = meal ? sumMealMacros(meal) : null
  const hasEntries = Boolean(meal && meal.entries.length > 0)
  const timeLabel = meal
    ? formatMealTime(meal.loggedAt, config.suggestedTime)
    : config.suggestedTime

  function handleToggleExpand() {
    if (!hasEntries) {
      onAdd()
      return
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setExpanded((current) => !current)
  }

  return (
    <View style={[styles.itemRow, dimmed && styles.itemRowDimmed]}>
      <View style={styles.railCol}>
        <Text style={styles.time}>{timeLabel}</Text>
        <View style={styles.rail}>
          <View style={[styles.railDot, hasEntries && styles.railDotFilled]} />
          {!isLast ? (
            <View style={[styles.railLine, hasEntries && styles.railLineFilled]} />
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={handleToggleExpand}
        style={({ pressed }) => [
          styles.card,
          hasEntries && styles.cardFilled,
          expanded && styles.cardExpanded,
          pressed && styles.cardPressed,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconWrap, { backgroundColor: `${config.color}22` }]}>
              <MaterialCommunityIcons
                name={config.icon}
                size={16}
                color={config.color}
              />
            </View>
            <View style={styles.cardTitleCol}>
              <Text style={styles.cardTitle}>{config.label}</Text>
              {hasEntries && macros ? (
                <Text style={styles.cardMeta}>
                  {formatCalories(macros.calories)} · P {Math.round(macros.proteinG)} · C{' '}
                  {Math.round(macros.carbsG)} · G {Math.round(macros.fatG)}
                </Text>
              ) : (
                <Text style={styles.cardEmpty}>Toque para registrar</Text>
              )}
            </View>
          </View>

          {hasEntries ? (
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSubtle}
            />
          ) : (
            <View style={styles.addBadge}>
              <MaterialCommunityIcons name="plus" size={14} color="#4d7c0f" />
            </View>
          )}
        </View>

        {expanded && meal ? (
          <View style={styles.entriesBlock}>
            {meal.entries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={styles.entryTextCol}>
                  <Text style={styles.entryName}>{entry.name}</Text>
                  <Text style={styles.entryPortion}>{entry.portionLabel}</Text>
                </View>
                <Text style={styles.entryCalories}>{formatCalories(entry.macros.calories)}</Text>
              </View>
            ))}

            <View style={styles.entryActions}>
              <Pressable onPress={onEdit} style={styles.entryActionBtn}>
                <Text style={styles.entryActionText}>Editar</Text>
              </Pressable>
              <Pressable onPress={onDelete} style={styles.entryActionBtnDanger}>
                <Text style={styles.entryActionTextDanger}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Pressable>
    </View>
  )
}

export function EatWellMealTimeline({
  record,
  filterSlot,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
}: EatWellMealTimelineProps) {
  const visibleSlots = filterSlot ? [filterSlot] : MEAL_SLOT_ORDER

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Linha do tempo</Text>
        {filterSlot ? (
          <Text style={styles.sectionFilter}>Filtrando · {getMealSlotConfig(filterSlot).label}</Text>
        ) : null}
      </View>

      <View style={styles.list}>
        {visibleSlots.map((slot, index) => {
          const meal = getMealForSlot(record, slot)
          const dimmed = Boolean(filterSlot && filterSlot !== slot)

          return (
            <TimelineItem
              key={slot}
              slot={slot}
              meal={meal}
              isLast={index === visibleSlots.length - 1}
              dimmed={dimmed}
              onAdd={() => onAddMeal(slot)}
              onEdit={() => meal && onEditMeal(meal)}
              onDelete={() => meal && onDeleteMeal(meal.id)}
            />
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    gap: 10,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionFilter: {
    color: '#4d7c0f',
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 10,
  },
  itemRowDimmed: {
    opacity: 0.35,
  },
  railCol: {
    width: 46,
    alignItems: 'center',
  },
  time: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  rail: {
    flex: 1,
    alignItems: 'center',
  },
  railDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
  },
  railDotFilled: {
    borderColor: '#65a30d',
    backgroundColor: '#84cc16',
  },
  railLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceBorder,
    minHeight: 24,
  },
  railLineFilled: {
    backgroundColor: 'rgba(132, 204, 22, 0.45)',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderStyle: 'dashed',
  },
  cardFilled: {
    backgroundColor: colors.backgroundElevated,
    borderStyle: 'solid',
    borderColor: colors.surfaceBorder,
  },
  cardExpanded: {
    borderColor: 'rgba(101, 163, 13, 0.35)',
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleCol: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  cardMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  cardEmpty: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  addBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfccb',
    borderWidth: 1,
    borderColor: 'rgba(101, 163, 13, 0.35)',
  },
  entriesBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    gap: 8,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  entryTextCol: {
    flex: 1,
    gap: 1,
  },
  entryName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  entryPortion: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  entryCalories: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: '800',
  },
  entryActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  entryActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  entryActionText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  entryActionBtnDanger: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
  },
  entryActionTextDanger: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
  },
})
