import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import { formatDurationLabel, estimateCircuitDurationSec } from '../../utils/functionalTraining'
import { CIRCUIT_EXERCISE_COUNT } from '../../types/functionalTraining'

type FunctionalQuickWorkoutCardProps = {
  onStart: () => void
}

export function FunctionalQuickWorkoutCard({ onStart }: FunctionalQuickWorkoutCardProps) {
  const totalSec = estimateCircuitDurationSec(CIRCUIT_EXERCISE_COUNT)

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onStart()
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Iniciar treino rápido de cinco minutos"
    >
      <LinearGradient
        colors={['#fb923c', '#f97316', '#ea580c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gloss}
          pointerEvents="none"
        />

        <View style={styles.content}>
          <View style={styles.textCol}>
            <Text style={styles.eyebrow}>Circuito guiado</Text>
            <Text style={styles.title}>Treino de {formatDurationLabel(totalSec)}</Text>
            <Text style={styles.subtitle}>
              {CIRCUIT_EXERCISE_COUNT} exercícios · 30s cada · 10s de descanso
            </Text>
          </View>

          <View style={styles.playBtn}>
            <Ionicons name="play" size={22} color="#ea580c" />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    marginHorizontal: 16,
    borderRadius: 20,
    shadowColor: 'rgba(249, 115, 22, 0.45)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
