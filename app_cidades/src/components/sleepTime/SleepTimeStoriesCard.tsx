import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { sleepTimeFeatureCardStyles } from './sleepTimeFeatureCardStyles'

type SleepTimeStoriesCardProps = {
  onPress: () => void
}

const STORIES_PALETTE = {
  iconGradient: ['#ddd6fe', '#a78bfa', '#7c3aed'],
  shadowColor: 'rgba(124, 58, 237, 0.45)',
  iconColor: '#6d28d9',
} as const

export function SleepTimeStoriesCard({ onPress }: SleepTimeStoriesCardProps) {
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
      accessibilityLabel="Histórias para dormir"
    >
      <LinearGradient
        colors={[...STORIES_PALETTE.iconGradient]}
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
          <View style={sleepTimeFeatureCardStyles.textCol}>
            <Text style={sleepTimeFeatureCardStyles.eyebrow}>Histórias</Text>
            <Text style={sleepTimeFeatureCardStyles.title} numberOfLines={2}>
              Histórias para dormir
            </Text>
            <Text style={styles.subtitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              Contos suaves para embalar crianças na hora de dormir
            </Text>
          </View>

          <View style={sleepTimeFeatureCardStyles.actionBtn}>
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              size={22}
              color={STORIES_PALETTE.iconColor}
            />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    shadowColor: STORIES_PALETTE.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
  },
})
