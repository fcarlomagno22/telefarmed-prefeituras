import { useThemedStyles } from '../../../hooks/useThemedStyles'
import type { ThemeColors } from '../../../theme/palettes'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CALCULATIONS_INTRO } from '../../../config/calculationsHowToPlay'
import { ActiveMindGameIcon } from '../ActiveMindGameIcon'
import type { ActiveMindGame } from '../../../types/activeMind'

type CalculationsIntroCardProps = {
  game: ActiveMindGame
  onHowToPlayPress: () => void
}

export function CalculationsIntroCard({ game, onHowToPlayPress }: CalculationsIntroCardProps) {
  const styles = useThemedStyles(createStyles)
  function handleHowToPlayPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onHowToPlayPress()
  }

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconShadow, { shadowColor: game.shadowColor }]}>
          <LinearGradient
            colors={[...game.iconGradient]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.icon}
          >
            <ActiveMindGameIcon icon={game.icon} size={28} color="#fff" />
          </LinearGradient>
        </View>

        <View style={styles.textCol}>
          <Text style={styles.title}>{CALCULATIONS_INTRO.title}</Text>
          <Text style={styles.summary}>{CALCULATIONS_INTRO.summary}</Text>
        </View>
      </View>

      <Text style={styles.rules}>{CALCULATIONS_INTRO.rulesBrief}</Text>

      <Pressable
        onPress={handleHowToPlayPress}
        style={({ pressed }) => [styles.linkWrap, pressed && styles.linkWrapPressed]}
        accessibilityRole="button"
        accessibilityLabel="Como jogar Cálculos"
      >
        <Text style={styles.link}>Como jogar</Text>
      </Pressable>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  summary: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  rules: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 17,
  },
  linkWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  linkWrapPressed: {
    opacity: 0.75,
  },
  link: {
    color: '#67e8f9',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
}
}
