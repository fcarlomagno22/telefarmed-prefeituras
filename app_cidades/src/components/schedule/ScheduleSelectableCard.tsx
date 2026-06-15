import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { colors } from '../../theme/colors'

type ScheduleSelectableCardProps = {
  selected: boolean
  onPress: () => void
  children: ReactNode
}

export function ScheduleSelectableCard({
  selected,
  onPress,
  children,
}: ScheduleSelectableCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      {selected ? (
        <LinearGradient
          colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
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
          {children}
        </LinearGradient>
      ) : (
        <View style={styles.default}>{children}</View>
      )}
    </Pressable>
  )
}

export function ScheduleCardCheck({ selected }: { selected: boolean }) {
  if (selected) {
    return <Ionicons name="checkmark-circle" size={22} color="#fff" />
  }
  return <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
}

export function ScheduleCardIcon({
  selected,
  icon,
}: {
  selected: boolean
  icon: keyof typeof MaterialCommunityIcons.glyphMap
}) {
  if (selected) {
    return (
      <View style={styles.iconSelected}>
        <MaterialCommunityIcons name={icon} size={20} color="#fff" />
      </View>
    )
  }

  return (
    <View style={styles.iconDefault}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.textMuted} />
    </View>
  )
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 140, 0.45)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  default: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(14, 14, 20, 0.75)',
  },
  iconSelected: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  iconDefault: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
})
