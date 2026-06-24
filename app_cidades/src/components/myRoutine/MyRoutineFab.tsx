import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import type { ThemeColors } from '../../theme/palettes'

type MyRoutineFabProps = {
  bottom: number
  onPress: () => void
}

export function MyRoutineFab({ bottom, onPress }: MyRoutineFabProps) {
  const styles = useThemedStyles(createStyles)
  const palette = ACTION_ICON_PALETTES.myRoutine

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.wrap, { bottom }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Ações rápidas da rotina"
    >
      <LinearGradient
        colors={[palette.iconGradient[0], palette.iconGradient[1], palette.iconGradient[2]]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.gradient}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          style={styles.gloss}
          pointerEvents="none"
        />
        <Ionicons name="add" size={30} color="#fff" />
      </LinearGradient>
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  wrap: {
    position: 'absolute',
    right: 18,
    zIndex: 20,
    shadowColor: 'rgba(217, 70, 239, 0.55)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  gradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
  },
}
}

