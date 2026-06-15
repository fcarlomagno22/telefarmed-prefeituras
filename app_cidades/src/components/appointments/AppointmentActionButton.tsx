import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ActionIconPalette } from '../../theme/actionIconColors'

type AppointmentActionButtonProps = {
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  palette: ActionIconPalette
  onPress: () => void
}

export function AppointmentActionButton({
  label,
  icon,
  palette,
  onPress,
}: AppointmentActionButtonProps) {
  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.shadow, { shadowColor: palette.shadowColor }]}>
        <LinearGradient
          colors={[...palette.iconGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.04)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={styles.gloss}
            pointerEvents="none"
          />
          <MaterialCommunityIcons name={icon} size={16} color="#fff" />
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </LinearGradient>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: 0,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  shadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
  },
  label: {
    flexShrink: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
})
