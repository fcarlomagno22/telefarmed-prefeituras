import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { ActiveMindPlayDifficulty } from '../../types/activeMind'

type ActiveMindDifficultyOptionProps = {
  title: string
  description: string
  gradient: readonly [string, string, string]
  shadowColor: string
  difficulty: ActiveMindPlayDifficulty
  onPress: (difficulty: ActiveMindPlayDifficulty) => void
}

export function ActiveMindDifficultyOption({
  title,
  description,
  gradient,
  shadowColor,
  difficulty,
  onPress,
}: ActiveMindDifficultyOptionProps) {
  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress(difficulty)
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Jogar no nível ${title}`}
    >
      <View style={[styles.iconShadow, { shadowColor }]}>
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.iconSquircle}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.55 }}
            style={styles.iconGloss}
            pointerEvents="none"
          />
          <MaterialCommunityIcons name="brain" size={24} color="#fff" />
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSubtle} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  cardPressed: {
    opacity: 0.9,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  iconSquircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
})
