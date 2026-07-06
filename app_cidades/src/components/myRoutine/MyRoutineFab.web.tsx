import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'

const FAB_SIZE = 58
const palette = ACTION_ICON_PALETTES.myRoutine

type MyRoutineFabProps = {
  bottom: number
  onPress: () => void
}

const FAB_GRADIENT = `linear-gradient(145deg, ${palette.iconGradient[0]} 15%, ${palette.iconGradient[1]} 55%, ${palette.iconGradient[2]} 100%)`

export function MyRoutineFab({ bottom, onPress }: MyRoutineFabProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        styles.fabVisual,
        { bottom },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Ações rápidas da rotina"
    >
      <View style={styles.gloss} pointerEvents="none" />
      <Ionicons name="add" size={30} color="#fff" />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'fixed',
    right: 18,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'transparent',
    elevation: 0,
    boxShadow: 'none',
    cursor: 'pointer',
  },
  fabVisual: {
    backgroundImage: FAB_GRADIENT,
    boxShadow: 'none',
    elevation: 0,
    filter: `drop-shadow(0 8px 14px ${palette.shadowColor})`,
  } as object,
  gloss: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.42), rgba(255,255,255,0) 55%)',
  } as object,
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
})
