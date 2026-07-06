import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Platform, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native'
import type { RunWalkDayEnergy } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import { formatCalories } from '../../utils/eatWellNutritionStats'

type EatWellRunWalkEnergyBadgeProps = {
  energy: RunWalkDayEnergy
  adjustedCalorieTarget: number
  onPress: () => void
}

const GRADIENT_TITLE_STYLE: TextStyle =
  Platform.OS === 'web'
    ? ({
        backgroundImage: 'linear-gradient(90deg, #dc2626 0%, #ea580c 45%, #65a30d 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      } as TextStyle)
    : { color: '#c2410c' }

export function EatWellRunWalkEnergyBadge({
  energy,
  adjustedCalorieTarget,
  onPress,
}: EatWellRunWalkEnergyBadgeProps) {
  const hasActivity = energy.totalCaloriesBurned > 0

  if (!hasActivity) {
    return (
      <View style={styles.wrap}>
        <View style={styles.emptyPill}>
          <MaterialCommunityIcons name="run-fast" size={14} color={colors.textSubtle} />
          <Text style={styles.emptyText}>Sem atividade hoje — meta calórica padrão</Text>
        </View>
      </View>
    )
  }

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const burnedLabel = formatCalories(energy.totalCaloriesBurned).replace(' kcal', '')

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
        accessibilityRole="button"
      >
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="run-fast" size={16} color="#dc2626" />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, GRADIENT_TITLE_STYLE]}>
            Hoje você gastou ~{burnedLabel} kcal
          </Text>
          <Text style={styles.subtitle}>
            Meta ajustada +{Math.round(energy.totalCaloriesBurned)} kcal ·{' '}
            {formatCalories(adjustedCalorieTarget)} total
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
  },
  pillPressed: {
    opacity: 0.9,
  },
  emptyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
})
