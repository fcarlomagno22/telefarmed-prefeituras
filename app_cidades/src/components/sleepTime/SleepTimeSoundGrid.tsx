import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { SLEEP_SOUNDS, type SleepSoundConfig } from '../../config/sleepSounds'
import { colors } from '../../theme/colors'
import type { SleepSoundId } from '../../types/sleepTime'

type SleepTimeSoundGridProps = {
  activeSoundId: SleepSoundId | null
  onSoundPress: (soundId: SleepSoundId) => void
}

const ICON_SIZE = 60
const ICON_RADIUS = 15
const ICON_GLYPH_SIZE = 40
const HORIZONTAL_PADDING = 16
const ITEM_GAP = 10
const ROW_GAP = 20
const COLUMNS = 4

function SoundAppIcon({
  sound,
  pressed,
  active,
  dimmed,
}: {
  sound: SleepSoundConfig
  pressed: boolean
  active: boolean
  dimmed: boolean
}) {
  const gradientColors = dimmed
    ? (['#e5e7eb', '#d1d5db', '#9ca3af'] as const)
    : sound.palette.iconGradient

  return (
    <View
      style={[
        styles.iconOuter,
        active && styles.iconOuterActive,
        dimmed && styles.iconOuterDimmed,
        !dimmed && { shadowColor: sound.palette.shadowColor },
        pressed && !dimmed && styles.iconShadowPressed,
        active && styles.iconShadowActive,
      ]}
    >
      <LinearGradient
        colors={[...gradientColors]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.iconSquircle}
      >
        {!dimmed ? (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.55 }}
            style={styles.iconGloss}
            pointerEvents="none"
          />
        ) : null}

        <MaterialCommunityIcons
          name={sound.icon}
          size={ICON_GLYPH_SIZE}
          color={dimmed ? '#f9fafb' : '#fff'}
        />
      </LinearGradient>
    </View>
  )
}

function SoundButton({
  sound,
  width,
  active,
  dimmed,
  onPress,
}: {
  sound: SleepSoundConfig
  width: number
  active: boolean
  dimmed: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={dimmed}
      style={({ pressed }) => [
        styles.appButton,
        { width },
        dimmed && styles.appButtonDimmed,
        pressed && !dimmed && styles.appButtonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={sound.title}
      accessibilityState={{ selected: active, disabled: dimmed }}
    >
      {({ pressed }) => (
        <>
          <SoundAppIcon sound={sound} pressed={pressed} active={active} dimmed={dimmed} />
          <Text
            style={[
              styles.appLabel,
              active && styles.appLabelActive,
              dimmed && styles.appLabelDimmed,
            ]}
            numberOfLines={2}
          >
            {sound.title}
          </Text>
        </>
      )}
    </Pressable>
  )
}

export function SleepTimeSoundGrid({ activeSoundId, onSoundPress }: SleepTimeSoundGridProps) {
  const { width: screenWidth } = useWindowDimensions()
  const itemWidth =
    (screenWidth - HORIZONTAL_PADDING * 2 - ITEM_GAP * (COLUMNS - 1)) / COLUMNS

  const rows = Array.from({ length: Math.ceil(SLEEP_SOUNDS.length / COLUMNS) }, (_, rowIndex) =>
    SLEEP_SOUNDS.slice(rowIndex * COLUMNS, rowIndex * COLUMNS + COLUMNS),
  )

  function handlePress(soundId: SleepSoundId) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSoundPress(soundId)
  }

  return (
    <View style={styles.wrapper}>
      {rows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[styles.row, rowIndex > 0 && { marginTop: ROW_GAP }]}
        >
          {row.map((sound) => {
            const active = activeSoundId === sound.id
            const dimmed = activeSoundId != null && !active

            return (
              <SoundButton
                key={sound.id}
                sound={sound}
                width={itemWidth}
                active={active}
                dimmed={dimmed}
                onPress={() => handlePress(sound.id)}
              />
            )
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 4,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: ITEM_GAP,
  },
  appButton: {
    alignItems: 'center',
    gap: 8,
  },
  appButtonPressed: {
    opacity: 0.82,
  },
  appButtonDimmed: {
    opacity: 0.72,
  },
  iconOuter: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  iconOuterActive: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: ICON_RADIUS,
  },
  iconOuterDimmed: {
    shadowOpacity: 0,
    elevation: 0,
  },
  iconShadowPressed: {
    transform: [{ scale: 0.94 }],
  },
  iconShadowActive: {
    shadowRadius: 14,
    shadowOpacity: 1,
  },
  iconSquircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  appLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 14,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  appLabelActive: {
    color: '#6366f1',
    fontWeight: '700',
  },
  appLabelDimmed: {
    color: colors.textSubtle,
    fontWeight: '500',
  },
})
