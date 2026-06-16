import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type { RunWalkQuickShortcutId } from '../../types/runWalk'

type RunWalkQuickShortcutsProps = {
  onShortcutPress: (id: RunWalkQuickShortcutId) => void
}

type ShortcutConfig = {
  id: RunWalkQuickShortcutId
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  palette: (typeof ACTION_ICON_PALETTES)[keyof typeof ACTION_ICON_PALETTES]
}

const SHORTCUTS: ShortcutConfig[] = [
  {
    id: 'start-activity',
    label: 'Iniciar atividade',
    icon: 'play',
    palette: ACTION_ICON_PALETTES.myAppointments,
  },
  {
    id: 'nearby-routes',
    label: 'Onde correr',
    icon: 'map-marker-radius',
    palette: ACTION_ICON_PALETTES.myGoals,
  },
]

const HORIZONTAL_PADDING = 16
const GAP = 10
const COLUMNS = 2

export function RunWalkQuickShortcuts({ onShortcutPress }: RunWalkQuickShortcutsProps) {
  const { width: screenWidth } = useWindowDimensions()
  const itemWidth =
    (screenWidth - HORIZONTAL_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS

  const rows = Array.from({ length: Math.ceil(SHORTCUTS.length / COLUMNS) }, (_, rowIndex) =>
    SHORTCUTS.slice(rowIndex * COLUMNS, rowIndex * COLUMNS + COLUMNS),
  )

  function handlePress(id: RunWalkQuickShortcutId) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onShortcutPress(id)
  }

  return (
    <View style={styles.wrap}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((shortcut) => (
            <Pressable
              key={shortcut.id}
              onPress={() => handlePress(shortcut.id)}
              style={({ pressed }) => [
                styles.item,
                { width: itemWidth },
                pressed && styles.itemPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={shortcut.label}
            >
              <View
                style={[styles.cardShadow, { shadowColor: shortcut.palette.shadowColor }]}
              >
                <LinearGradient
                  colors={[...shortcut.palette.iconGradient]}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={styles.card}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.06)', 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.55 }}
                    style={styles.cardGloss}
                    pointerEvents="none"
                  />

                  <View style={styles.cardContent}>
                    <MaterialCommunityIcons name={shortcut.icon} size={22} color="#fff" />
                    <Text style={styles.label} numberOfLines={2}>
                      {shortcut.label}
                    </Text>
                  </View>
                </LinearGradient>
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
    paddingBottom: 4,
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
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  cardShadow: {
    width: '100%',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 6,
  },
  card: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  cardGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'left',
    lineHeight: 15,
    letterSpacing: -0.1,
  },
})
