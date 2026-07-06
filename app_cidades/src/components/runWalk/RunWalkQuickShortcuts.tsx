import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import type { RunWalkQuickShortcutId } from '../../types/runWalk'

type RunWalkQuickShortcutsProps = {
  onShortcutPress: (id: RunWalkQuickShortcutId) => void
  onChallengesPress: () => void
  onAchievementsPress: () => void
}

type ShortcutAccent = {
  gradient: readonly [string, string, string]
  borderColor: string
}

type ShortcutButtonConfig = {
  id: string
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  accent: ShortcutAccent
  onPress: () => void
}

const START_ACTIVITY_ACCENT: ShortcutAccent = {
  gradient: ['#1d4ed8', '#3b82f6', '#60a5fa'],
  borderColor: 'rgba(37, 99, 235, 0.28)',
}

const NEARBY_ROUTES_ACCENT: ShortcutAccent = {
  gradient: ['#166534', '#22c55e', '#4ade80'],
  borderColor: 'rgba(22, 163, 74, 0.28)',
}

const CHALLENGES_ACCENT: ShortcutAccent = {
  gradient: ['#9d174d', '#db2777', '#f472b6'],
  borderColor: 'rgba(190, 24, 93, 0.28)',
}

const ACHIEVEMENTS_ACCENT: ShortcutAccent = {
  gradient: ['#92400e', '#d97706', '#f59e0b'],
  borderColor: 'rgba(180, 83, 9, 0.28)',
}

const HORIZONTAL_PADDING = 16
const GAP = 10
const COLUMNS = 2

export function RunWalkQuickShortcuts({
  onShortcutPress,
  onChallengesPress,
  onAchievementsPress,
}: RunWalkQuickShortcutsProps) {
  const { width: screenWidth } = useWindowDimensions()
  const itemWidth =
    (screenWidth - HORIZONTAL_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS

  function handlePress(id: RunWalkQuickShortcutId) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onShortcutPress(id)
  }

  function handleChallengesPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChallengesPress()
  }

  function handleAchievementsPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onAchievementsPress()
  }

  const rows: ShortcutButtonConfig[][] = [
    [
      {
        id: 'start-activity',
        label: 'Iniciar atividade',
        icon: 'play',
        accent: START_ACTIVITY_ACCENT,
        onPress: () => handlePress('start-activity'),
      },
      {
        id: 'nearby-routes',
        label: 'Onde correr',
        icon: 'map-marker-radius',
        accent: NEARBY_ROUTES_ACCENT,
        onPress: () => handlePress('nearby-routes'),
      },
    ],
    [
      {
        id: 'challenges',
        label: 'Desafios',
        icon: 'bullseye-arrow',
        accent: CHALLENGES_ACCENT,
        onPress: handleChallengesPress,
      },
      {
        id: 'achievements',
        label: 'Conquistas',
        icon: 'medal-outline',
        accent: ACHIEVEMENTS_ACCENT,
        onPress: handleAchievementsPress,
      },
    ],
  ]

  return (
    <View style={styles.wrap}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((shortcut) => (
            <Pressable
              key={shortcut.id}
              onPress={shortcut.onPress}
              style={({ pressed }) => [
                styles.item,
                { width: itemWidth },
                pressed && styles.itemPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={shortcut.label}
            >
              <LinearGradient
                colors={[...shortcut.accent.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.card,
                  {
                    borderColor: shortcut.accent.borderColor,
                  },
                ]}
              >
                <View style={styles.iconOrb}>
                  <MaterialCommunityIcons name={shortcut.icon} size={22} color="#ffffff" />
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {shortcut.label}
                </Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  item: {
    flexGrow: 0,
    flexShrink: 0,
  },
  itemPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  card: {
    width: '100%',
    minHeight: 88,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  iconOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  label: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 15,
    letterSpacing: -0.1,
    textShadowColor: 'rgba(15, 23, 42, 0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
})
