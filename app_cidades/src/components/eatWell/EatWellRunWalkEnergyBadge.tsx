import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { RunWalkDayEnergy } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import { formatCalories } from '../../utils/eatWellNutritionStats'

type EatWellRunWalkEnergyBadgeProps = {
  energy: RunWalkDayEnergy
  adjustedCalorieTarget: number
  onPress: () => void
}

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

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={['rgba(239, 68, 68, 0.18)', 'rgba(132, 204, 22, 0.14)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="run-fast" size={16} color="#fca5a5" />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>
            Hoje você gastou ~{formatCalories(energy.totalCaloriesBurned).replace(' kcal', '')} kcal
          </Text>
          <Text style={styles.subtitle}>
            Meta ajustada +{Math.round(energy.totalCaloriesBurned)} kcal ·{' '}
            {formatCalories(adjustedCalorieTarget)} total
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSubtle} />
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
})
