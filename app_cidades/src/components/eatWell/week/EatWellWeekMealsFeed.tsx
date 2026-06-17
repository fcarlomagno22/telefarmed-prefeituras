import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { EatWellWeekMealItem } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { formatCalories } from '../../../utils/eatWellNutritionStats'
import { getMealSlotConfig } from '../../../utils/eatWellMealSlots'

type EatWellWeekMealsFeedProps = {
  meals: EatWellWeekMealItem[]
}

export function EatWellWeekMealsFeed({ meals }: EatWellWeekMealsFeedProps) {
  const [expanded, setExpanded] = useState(false)

  if (meals.length === 0) return null

  const visibleMeals = expanded ? meals : meals.slice(0, 4)

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          setExpanded((current) => !current)
        }}
        style={styles.header}
      >
        <View>
          <Text style={styles.title}>Refeições da semana</Text>
          <Text style={styles.subtitle}>{meals.length} registros</Text>
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSubtle}
        />
      </Pressable>

      <View style={styles.list}>
        {visibleMeals.map((item) => {
          const slotConfig = getMealSlotConfig(item.meal.slot)
          return (
            <View key={`${item.dateIso}-${item.meal.id}`} style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: `${slotConfig.color}22` }]}>
                <MaterialCommunityIcons name={slotConfig.icon} size={14} color={slotConfig.color} />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.rowTitle}>
                  {slotConfig.label} · {item.weekdayLabel}
                </Text>
                <Text style={styles.rowMeta}>
                  {item.meal.entries.length} {item.meal.entries.length === 1 ? 'item' : 'itens'}
                </Text>
              </View>
              <Text style={styles.calories}>{formatCalories(item.calories)}</Text>
            </View>
          )
        })}
      </View>

      {!expanded && meals.length > 4 ? (
        <Text style={styles.moreHint}>+ {meals.length - 4} refeições · toque para expandir</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
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
  subtitle: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  calories: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '800',
  },
  moreHint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
})
