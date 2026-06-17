import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { EatWellMenuMeal } from '../../../types/eatWell'
import type { MealSlot } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import {
  computeMenuMealCalories,
  getMenuDetailSuggestedTime,
} from '../../../utils/eatWellMenuDetail'
import { getMealSlotConfig } from '../../../utils/eatWellMealSlots'

type EatWellMenuMealSlotCardProps = {
  slot: MealSlot
  meal: EatWellMenuMeal | null
  consumedCount: number
  totalCount: number
  onPress: () => void
}

export function EatWellMenuMealSlotCard({
  slot,
  meal,
  consumedCount,
  totalCount,
  onPress,
}: EatWellMenuMealSlotCardProps) {
  const config = getMealSlotConfig(slot)
  const suggestedTime = getMenuDetailSuggestedTime(slot)
  const calories = computeMenuMealCalories(meal)
  const hasItems = (meal?.entries.length ?? 0) > 0

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${config.color}18` }]}>
        <MaterialCommunityIcons name={config.icon} size={17} color={config.color} />
      </View>

      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{config.label}</Text>
          <Text style={styles.time}>{suggestedTime}</Text>
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {hasItems
            ? `${meal!.entries.length} ${meal!.entries.length === 1 ? 'alimento' : 'alimentos'} · ~${calories} kcal`
            : 'Sem sugestões para esta refeição'}
          {totalCount > 0 ? ` · ${consumedCount}/${totalCount} consumidos` : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  time: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
})
