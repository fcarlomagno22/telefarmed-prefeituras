import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { sleepTimeFeatureCardStyles } from './sleepTimeFeatureCardStyles'

type SleepTimeBreathingCardProps = {
  onPress: () => void
}

export function SleepTimeBreathingCard({ onPress }: SleepTimeBreathingCardProps) {
  const palette = ACTION_ICON_PALETTES.mentalHealth

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        sleepTimeFeatureCardStyles.pressable,
        styles.pressable,
        pressed && sleepTimeFeatureCardStyles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Exercício de respiração guiada"
    >
      <LinearGradient
        colors={[palette.iconGradient[0], palette.iconGradient[1], palette.iconGradient[2]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={sleepTimeFeatureCardStyles.card}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={sleepTimeFeatureCardStyles.gloss}
          pointerEvents="none"
        />

        <View style={sleepTimeFeatureCardStyles.content}>
          <View style={[sleepTimeFeatureCardStyles.textCol, styles.textCol]}>
            <Text style={sleepTimeFeatureCardStyles.eyebrow}>Relaxamento</Text>
            <Text style={styles.title} numberOfLines={2}>
              Exercício de respiração guiada
            </Text>
            <Text style={sleepTimeFeatureCardStyles.subtitle} numberOfLines={1}>
              Relaxe e prepare-se para dormir
            </Text>
          </View>

          <View style={sleepTimeFeatureCardStyles.actionBtn}>
            <Ionicons name="leaf-outline" size={22} color="#0891b2" />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    shadowColor: 'rgba(8, 145, 178, 0.45)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  textCol: {
    gap: 2,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 18,
  },
})
