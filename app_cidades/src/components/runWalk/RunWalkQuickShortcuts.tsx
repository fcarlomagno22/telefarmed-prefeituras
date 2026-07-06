import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { RunWalkQuickShortcutId } from '../../types/runWalk'

type RunWalkQuickShortcutsProps = {
  onShortcutPress: (id: RunWalkQuickShortcutId) => void
  onChallengesPress: () => void
  onAchievementsPress: () => void
}

type ShortcutAccent = {
  iconColor: string
  orbBackground: string
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
  iconColor: '#2563eb',
  orbBackground: '#dbeafe',
  borderColor: 'rgba(37, 99, 235, 0.22)',
}

const NEARBY_ROUTES_ACCENT: ShortcutAccent = {
  iconColor: '#15803d',
  orbBackground: '#dcfce7',
  borderColor: 'rgba(22, 163, 74, 0.22)',
}

const CHALLENGES_ACCENT: ShortcutAccent = {
  iconColor: '#be185d',
  orbBackground: '#fce7f3',
  borderColor: 'rgba(190, 24, 93, 0.22)',
}

const ACHIEVEMENTS_ACCENT: ShortcutAccent = {
  iconColor: '#b45309',
  orbBackground: '#fef3c7',
  borderColor: 'rgba(180, 83, 9, 0.22)',
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
              <View
                style={[
                  styles.card,
                  {
                    borderColor: shortcut.accent.borderColor,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconOrb,
                    { backgroundColor: shortcut.accent.orbBackground },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={shortcut.icon}
                    size={22}
                    color={shortcut.accent.iconColor}
                  />
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {shortcut.label}
                </Text>
              </View>
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
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
    letterSpacing: -0.1,
  },
})
