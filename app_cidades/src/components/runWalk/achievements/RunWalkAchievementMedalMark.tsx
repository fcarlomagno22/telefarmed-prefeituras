import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import type { RunWalkAchievementIcon } from '../../../types/runWalkAchievements'

type MedalMarkSize = 'sm' | 'md' | 'lg' | 'xl'

type RunWalkAchievementMedalMarkProps = {
  accentColor: string
  icon: RunWalkAchievementIcon
  locked?: boolean
  size?: MedalMarkSize
  showGlow?: boolean
}

const SIZE_MAP: Record<
  MedalMarkSize,
  { outer: number; border: number; glowPad: number; icon: number }
> = {
  sm: { outer: 52, border: 2, glowPad: 4, icon: 22 },
  md: { outer: 64, border: 2, glowPad: 6, icon: 30 },
  lg: { outer: 58, border: 2, glowPad: 5, icon: 26 },
  xl: { outer: 92, border: 2, glowPad: 8, icon: 44 },
}

export function RunWalkAchievementMedalMark({
  accentColor,
  icon,
  locked = false,
  size = 'md',
  showGlow = false,
}: RunWalkAchievementMedalMarkProps) {
  const metrics = SIZE_MAP[size]
  const borderColor = locked ? 'rgba(255, 255, 255, 0.12)' : `${accentColor}88`
  const fillColor = locked ? 'rgba(255, 255, 255, 0.04)' : `${accentColor}18`
  const iconColor = locked ? 'rgba(245,245,247,0.28)' : accentColor

  const medal = (
    <View
      style={[
        styles.outer,
        {
          width: metrics.outer,
          height: metrics.outer,
          borderRadius: metrics.outer / 2,
          borderWidth: metrics.border,
          borderColor,
          backgroundColor: fillColor,
        },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={metrics.icon} color={iconColor} />
    </View>
  )

  if (!showGlow || locked) {
    return medal
  }

  return (
    <View
      style={[
        styles.glowWrap,
        {
          padding: metrics.glowPad,
          borderRadius: (metrics.outer + metrics.glowPad * 2) / 2,
          backgroundColor: `${accentColor}22`,
          shadowColor: accentColor,
        },
      ]}
    >
      {medal}
    </View>
  )
}

const styles = StyleSheet.create({
  glowWrap: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 6,
  },
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
