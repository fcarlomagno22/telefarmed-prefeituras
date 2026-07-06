import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Platform, Pressable, StyleSheet } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'

const FAB_SIZE = 58

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
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    right: 18,
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: Platform.OS === 'web' ? 1000 : 20,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  gradient: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    ...Platform.select({
      web: {
        boxShadow: 'none',
        elevation: 0,
        filter: `drop-shadow(0 8px 14px ${ACTION_ICON_PALETTES.sleepTime.shadowColor})`,
      },
      default: {
        shadowColor: ACTION_ICON_PALETTES.sleepTime.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.55,
        shadowRadius: 14,
        elevation: 12,
      },
    }),
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
  },
})
