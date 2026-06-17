import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'

type SleepTimeFabProps = {
  bottom: number
  onPress: () => void
}

export function SleepTimeFab({ bottom, onPress }: SleepTimeFabProps) {
  const palette = ACTION_ICON_PALETTES.sleepTime

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.wrap, { bottom }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Registrar sono"
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

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 18,
    zIndex: 20,
    shadowColor: ACTION_ICON_PALETTES.sleepTime.shadowColor,
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
})
