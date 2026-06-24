import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { ActiveMindGame } from '../../types/activeMind'
import { ActiveMindGameIcon } from './ActiveMindGameIcon'

type ActiveMindGameCardProps = {
  game: ActiveMindGame
  onPress: () => void
}

export function ActiveMindGameCard({ game, onPress }: ActiveMindGameCardProps) {
  const isComingSoon = game.status === 'coming-soon'

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${game.title}. ${game.subtitle}`}
    >
      <View style={[styles.iconShadow, { shadowColor: game.shadowColor }]}>
        <LinearGradient
          colors={[...game.iconGradient]}
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
          <ActiveMindGameIcon icon={game.icon} size={28} color="#fff" />
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {game.title}
          </Text>
          {isComingSoon ? (
            <View style={styles.badgeSoon}>
              <Text style={styles.badgeSoonText}>Em breve</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.subtitle} numberOfLines={1}>
          {game.subtitle}
        </Text>

        <Text style={styles.description}>{game.description}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSubtle} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    padding: 14,
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
    width: 56,
    height: 56,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  badgeSoon: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(244, 114, 182, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.28)',
  },
  badgeSoonText: {
    color: '#f9a8d4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 15,
    height: 30,
    marginTop: 2,
  },
})
