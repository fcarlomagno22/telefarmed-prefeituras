import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ActionIconPalette } from '../../theme/actionIconColors'

type AppointmentQuickActionProps = {
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  palette: ActionIconPalette
  onPress: () => void
  compact?: boolean
}

export function AppointmentQuickAction({
  label,
  icon,
  palette,
  onPress,
  compact = false,
}: AppointmentQuickActionProps) {
  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        pressed && styles.buttonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {({ pressed }) => (
        <>
          <View
            style={[
              styles.iconShadow,
              { shadowColor: palette.shadowColor },
              pressed && styles.iconShadowPressed,
            ]}
          >
            <LinearGradient
              colors={[...palette.iconGradient]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={[styles.iconSquircle, compact && styles.iconSquircleCompact]}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.55 }}
                style={styles.iconGloss}
                pointerEvents="none"
              />
              <MaterialCommunityIcons
                name={icon}
                size={compact ? 18 : 20}
                color="#fff"
              />
            </LinearGradient>
          </View>
          <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={2}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 72,
  },
  buttonCompact: {
    minWidth: 64,
  },
  buttonPressed: {
    opacity: 0.86,
  },
  iconShadow: {
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  iconShadowPressed: {
    transform: [{ scale: 0.94 }],
  },
  iconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconSquircleCompact: {
    width: 40,
    height: 40,
    borderRadius: 11,
  },
  iconGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  label: {
    color: 'rgba(245, 245, 247, 0.82)',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  labelCompact: {
    fontSize: 9,
  },
})
