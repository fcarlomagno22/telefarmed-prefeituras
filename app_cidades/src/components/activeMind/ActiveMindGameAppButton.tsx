import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ActiveMindGame } from '../../types/activeMind'
import { ActiveMindGameIcon } from './ActiveMindGameIcon'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

type ActiveMindGameAppButtonProps = {
  game: ActiveMindGame
  width: number
  onPress: () => void
}

const ICON_SIZE = 52
const ICON_RADIUS = 13
const ICON_GLYPH_SIZE = 30

function GameAppIcon({
  game,
  pressed,
}: {
  game: ActiveMindGame
  pressed: boolean
}) {
  const styles = useThemedStyles(createStyles)
  const isComingSoon = game.status === 'coming-soon'

  return (
    <View
      style={[
        styles.iconShadow,
        { shadowColor: game.shadowColor },
        pressed && styles.iconShadowPressed,
        isComingSoon && styles.iconShadowSoon,
      ]}
    >
      <LinearGradient
        colors={[...game.iconGradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.iconSquircle, isComingSoon && styles.iconSquircleSoon]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          style={styles.iconGloss}
          pointerEvents="none"
        />

        <ActiveMindGameIcon icon={game.icon} size={ICON_GLYPH_SIZE} color="#fff" />
      </LinearGradient>
    </View>
  )
}

export function ActiveMindGameAppButton({ game, width, onPress }: ActiveMindGameAppButtonProps) {
  const styles = useThemedStyles(createStyles)
  const isComingSoon = game.status === 'coming-soon'

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.appButton,
        { width },
        pressed && styles.appButtonPressed,
        isComingSoon && styles.appButtonSoon,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${game.title}. ${game.subtitle}`}
    >
      {({ pressed }) => (
        <>
          <GameAppIcon game={game} pressed={pressed} />
          <Text style={[styles.appLabel, isComingSoon && styles.appLabelSoon]} numberOfLines={2}>
            {game.title}
          </Text>
          {isComingSoon ? <Text style={styles.soonHint}>Em breve</Text> : null}
        </>
      )}
    </Pressable>
  )
}

export const ACTIVE_MIND_GAME_GRID = {
  iconSize: ICON_SIZE,
  iconRadius: ICON_RADIUS,
}

function createStyles(colors: ThemeColors) {
  return {
  appButton: {
    alignItems: 'center',
    gap: 7,
  },
  appButtonPressed: {
    opacity: 0.82,
  },
  appButtonSoon: {
    opacity: 0.72,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  iconShadowPressed: {
    transform: [{ scale: 0.94 }],
  },
  iconShadowSoon: {
    shadowOpacity: 0.55,
  },
  iconSquircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconSquircleSoon: {
    opacity: 0.88,
  },
  iconGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  appLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 12,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  appLabelSoon: {
    color: colors.textMuted,
  },
  soonHint: {
    color: '#f9a8d4',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.1,
    textAlign: 'center',
    marginTop: -4,
  },
}
}

