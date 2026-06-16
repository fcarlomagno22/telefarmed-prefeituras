import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text } from 'react-native'

type RunWalkActivitySosButtonProps = {
  onPress: () => void
}

export function RunWalkActivitySosButton({ onPress }: RunWalkActivitySosButtonProps) {
  function handlePress() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    onPress()
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="SOS emergência"
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <Text style={styles.label}>SOS</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minWidth: 58,
    minHeight: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#ef4444',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
})
