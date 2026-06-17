import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { EatWellWeekSummary } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { formatCalories } from '../../../utils/eatWellNutritionStats'

type EatWellWeekRunWalkCardProps = {
  summary: EatWellWeekSummary
  onPress?: () => void
}

export function EatWellWeekRunWalkCard({ summary, onPress }: EatWellWeekRunWalkCardProps) {
  if (summary.runWalkTotalBurned <= 0) return null

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.cardPressable, pressed && onPress && styles.pressed]}
      >
        <LinearGradient
          colors={['rgba(239, 68, 68, 0.14)', 'rgba(132, 204, 22, 0.1)', 'rgba(14, 14, 20, 0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="run-fast" size={18} color="#fca5a5" />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>Energia de movimento</Text>
            <Text style={styles.subtitle}>
              {formatCalories(summary.runWalkTotalBurned)} gastas · metas ajustadas em{' '}
              {summary.runWalkActiveDays} {summary.runWalkActiveDays === 1 ? 'dia' : 'dias'}
            </Text>
          </View>
          {onPress ? (
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSubtle} />
          ) : null}
        </LinearGradient>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
  },
  cardPressable: {
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
})
