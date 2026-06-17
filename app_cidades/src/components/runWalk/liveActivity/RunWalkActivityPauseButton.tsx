import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet } from 'react-native'

type RunWalkActivityPauseButtonProps = {
  isPaused: boolean
  onPress: () => void
}

export function RunWalkActivityPauseButton({
  isPaused,
  onPress,
}: RunWalkActivityPauseButtonProps) {
  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isPaused ? 'Continuar treino' : 'Pausar treino'}
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <LinearGradient
        colors={isPaused ? ['#fde68a', '#fbbf24', '#d97706'] : ['#fef08a', '#facc15', '#eab308']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Ionicons name={isPaused ? 'play' : 'pause'} size={22} color="#fff" />
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.5)',
    shadowColor: '#ca8a04',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
