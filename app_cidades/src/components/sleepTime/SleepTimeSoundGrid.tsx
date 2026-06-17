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

const ICON_SIZE = 52
const ICON_RADIUS = 13
const ICON_GLYPH_SIZE = 30
const HORIZONTAL_PADDING = 16
const ITEM_GAP = 10
const ROW_GAP = 20
const COLUMNS = 4

function SoundAppIcon({
  sound,
  pressed,
  active,
}: {
  sound: SleepSoundConfig
  pressed: boolean
  active: boolean
}) {
  return (
    <View
      style={[
        styles.iconOuter,
        active && styles.iconOuterActive,
        { shadowColor: sound.palette.shadowColor },
        pressed && styles.iconShadowPressed,
        active && styles.iconShadowActive,
      ]}
    >
      <LinearGradient
        colors={[...sound.palette.iconGradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.iconSquircle}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.06)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.55 }}
          style={styles.iconGloss}
          pointerEvents="none"
        />

        <MaterialCommunityIcons name={sound.icon} size={ICON_GLYPH_SIZE} color="#fff" />
      </LinearGradient>
    </View>
  )
}

function SoundButton({
  sound,
  width,
  active,
  onPress,
}: {
  sound: SleepSoundConfig
  width: number
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.appButton,
        { width },
        pressed && styles.appButtonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={sound.title}
      accessibilityState={{ selected: active }}
    >
      {({ pressed }) => (
        <>
          <SoundAppIcon sound={sound} pressed={pressed} active={active} />
          <Text style={[styles.appLabel, active && styles.appLabelActive]} numberOfLines={2}>
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
          {row.map((sound) => (
            <SoundButton
              key={sound.id}
              sound={sound}
              width={itemWidth}
              active={activeSoundId === sound.id}
              onPress={() => handlePress(sound.id)}
            />
          ))}
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
    gap: 7,
  },
  appButtonPressed: {
    opacity: 0.82,
  },
  iconOuter: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
    borderRadius: ICON_RADIUS + 2,
    padding: 2,
  },
  iconOuterActive: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
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
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 12,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  appLabelActive: {
    color: '#c7d2fe',
    fontWeight: '700',
  },
})
